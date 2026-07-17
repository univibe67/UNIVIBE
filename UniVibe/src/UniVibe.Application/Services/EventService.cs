using AutoMapper;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public sealed class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEventCategoryRepository _categoryRepository;
        private readonly IImageService _imageService;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public EventService(IEventRepository eventRepository, IEventCategoryRepository categoryRepository, IImageService imageService, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
            _imageService = imageService;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        public async Task CreateEventAsync(CreateEventRequest request, Guid userId)
        {


            var hasActiveEvent = await _eventRepository.AnyAsync(e =>
                e.UserId == userId &&
                e.EventDate > DateTime.UtcNow &&
                e.IsDeleted == false);

            if (hasActiveEvent)
                throw new Exception("Aktif bir etkinliğin varken yeni bir tane oluşturamazsın.");

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
                throw new Exception("Seçilen kategori bulunamadı!");

            string? imageUrl = null;
            string? imagePublicId = null;
            if (request.ImageFile != null)
            {
                var uploadResult = await _imageService.UploadImageAsync(request.ImageFile, "Events");
                imageUrl = uploadResult.Url;
                imagePublicId = uploadResult.PublicId;
            }

            var newEvent = _mapper.Map<Event>(request);
            newEvent.UserId = userId;
            newEvent.ImageUrl = imageUrl;
            newEvent.ImagePublicId = imagePublicId;

            await _eventRepository.AddAsync(newEvent);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(int pageNumber, int pageSize, bool onlyActive = true)
        {
            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(pageNumber, pageSize, onlyActive);

            var EventDetailResponses = _mapper.Map<List<EventDetailResponse>>(items);

            return new PaginatedResult<EventDetailResponse>
            {
                Items = EventDetailResponses,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<List<EventCategoryResponse>> GetCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            return _mapper.Map<List<EventCategoryResponse>>(categories);
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

             _eventRepository.Update(existingEvent);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<EventDetailResponse> GetEventByIdAsync(Guid eventId, Guid currentUserId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);

            if (eventEntity == null)
                throw new Exception("Etkinlik bulunamadı.");

            var EventDetailResponse = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
                EventDetailResponse.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";

            if (eventEntity.Category != null)
                EventDetailResponse.CategoryName = eventEntity.Category.Name;

            EventDetailResponse.IsCreator = (eventEntity.UserId == currentUserId);

            return EventDetailResponse;
        }
        public async Task<EventDetailResponse?> GetMyActiveEventAsync(Guid userId)
        {
            var activeEvent = await _eventRepository.GetActiveEventByUserIdAsync(userId);

            if (activeEvent == null)
                return null;

            var EventDetailResponse = _mapper.Map<EventDetailResponse>(activeEvent);

            if (activeEvent.Category != null)
                EventDetailResponse.CategoryName = activeEvent.Category.Name;

            return EventDetailResponse;
        }
    }
}
