using UniVibe.Application.Constants;
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

        public EventService(IEventRepository eventRepository, IEventCategoryRepository categoryRepository, IImageService imageService)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
            _imageService = imageService;
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

            var newEvent = new Event
            {
                Title = createEventDto.Title,
                Description = createEventDto.Description,
                EventDate = createEventDto.EventDate,
                Location = createEventDto.Location,
                UserId = userId,
                CategoryId = createEventDto.CategoryId,
                ImageUrl = imageUrl,
                ImagePublicId = imagePublicId,
            };

            await _eventRepository.AddAsync(newEvent);
        }

        public async Task<PaginatedResult<EventDto>> GetAllEventsAsync(int pageNumber, int pageSize, bool onlyActive = true)
        {
            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(pageNumber, pageSize, onlyActive);

            var eventDtos = items.Select(e => new EventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location,
                CategoryId = e.CategoryId,
                ImageUrl = e.ImageUrl
            }).ToList();

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

            return categories.Select(c => new EventCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                Color = c.Color
            }).ToList();
        }
        public async Task DeleteEventAsync(Guid eventId, Guid userId)
        {
            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e =>e.Id == eventId);

            if (existingEvent == null)
                throw new Exception("Etkinlik bulunamadı.");

            if (existingEvent.UserId != userId)
                throw new Exception("Bu etkinliği silmeye yetkiniz yok.");

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
    }
}
