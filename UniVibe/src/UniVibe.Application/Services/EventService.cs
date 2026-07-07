using AutoMapper;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEventCategoryRepository _categoryRepository;
        private readonly IImageService _imageService;
        private readonly IMapper _mapper;

        public EventService(IEventRepository eventRepository, IEventCategoryRepository categoryRepository, IImageService imageService, IMapper mapper)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
            _imageService = imageService;
            _mapper = mapper;
        }

        public async Task CreateEventAsync(CreateEventDto createEventDto, Guid userId)
        {


            var hasActiveEvent = await _eventRepository.AnyAsync(e =>
                e.UserId == userId &&
                e.EventDate > DateTime.UtcNow &&
                e.IsDeleted == false);

            if (hasActiveEvent)
                throw new Exception("Aktif bir etkinliğin varken yeni bir tane oluşturamazsın.");

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == createEventDto.CategoryId);
            if (!categoryExists)
                throw new Exception("Seçilen kategori bulunamadı!");

            string? imageUrl = null;
            string? imagePublicId = null;
            if (createEventDto.ImageFile != null)
            {
                var uploadResult = await _imageService.UploadImageAsync(createEventDto.ImageFile, "Events");
                imageUrl = uploadResult.Url;
                imagePublicId = uploadResult.PublicId;
            }

            var newEvent = _mapper.Map<Event>(createEventDto);
            newEvent.UserId = userId;
            newEvent.ImageUrl = imageUrl;
            newEvent.ImagePublicId = imagePublicId;

            await _eventRepository.AddAsync(newEvent);
        }

        public async Task<PaginatedResult<EventDto>> GetAllEventsAsync(int pageNumber, int pageSize, bool onlyActive = true)
        {
            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(pageNumber, pageSize, onlyActive);

            var eventDtos = _mapper.Map<List<EventDto>>(items);

            return new PaginatedResult<EventDto>
            {
                Items = eventDtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<List<EventCategoryDto>> GetCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            return _mapper.Map<List<EventCategoryDto>>(categories);
        }
        public async Task DeleteEventAsync(Guid eventId, Guid userId)
        {
            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e =>e.Id == eventId);

            if (existingEvent == null)
                throw new Exception("Etkinlik bulunamadı.");

            if (existingEvent.UserId != userId)
                throw new Exception("Bu etkinliği silmeye yetkiniz yok.");

            var timeDifference = existingEvent.EventDate - DateTime.UtcNow;

            if (timeDifference.TotalHours < 0)
                throw new Exception("Başlamış veya geçmiş bir etkinlik iptal edilemez.");

            if (timeDifference.TotalHours < 4)
                throw new Exception("Etkinliğe 4 saatten az bir süre kaldığı için iptal işlemi yapılamaz.");

            if (!string.IsNullOrEmpty(existingEvent.ImagePublicId))
            {
                await _imageService.DeleteImageAsync(existingEvent.ImagePublicId);

                existingEvent.ImageUrl = null;
                existingEvent.ImagePublicId = null;
            }

            existingEvent.IsDeleted = true;
            existingEvent.UpdatedAt = DateTime.UtcNow;

            await _eventRepository.UpdateAsync(existingEvent);
        }
        public async Task<EventDto> GetEventByIdAsync(Guid eventId, Guid currentUserId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);

            if (eventEntity == null)
                throw new Exception("Etkinlik bulunamadı.");

            var eventDto = _mapper.Map<EventDto>(eventEntity);

            if (eventEntity.User != null)
                eventDto.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";

            if (eventEntity.Category != null)
                eventDto.CategoryName = eventEntity.Category.Name;

            eventDto.IsCreator = (eventEntity.UserId == currentUserId);

            return eventDto;
        }
        public async Task<EventDto?> GetMyActiveEventAsync(Guid userId)
        {
            var activeEvent = await _eventRepository.GetActiveEventByUserIdAsync(userId);

            if (activeEvent == null)
                return null;

            var eventDto = _mapper.Map<EventDto>(activeEvent);

            if (activeEvent.Category != null)
                eventDto.CategoryName = activeEvent.Category.Name;

            return eventDto;
        }
    }
}
