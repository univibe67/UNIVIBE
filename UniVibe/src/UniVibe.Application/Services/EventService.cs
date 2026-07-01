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

        public EventService(IEventRepository eventRepository, IEventCategoryRepository categoryRepository)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
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

            var newEvent = new Event
            {
                Title = createEventDto.Title,
                Description = createEventDto.Description,
                EventDate = createEventDto.EventDate,
                Location = createEventDto.Location,
                UserId = userId,
                CategoryId = createEventDto.CategoryId
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
                CategoryId = e.CategoryId
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

            existingEvent.IsDeleted = true;
            existingEvent.UpdatedAt = DateTime.UtcNow;

            await _eventRepository.UpdateAsync(existingEvent);
        }
    }
}
