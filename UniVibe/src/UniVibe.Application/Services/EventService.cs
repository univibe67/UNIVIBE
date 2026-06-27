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

        public EventService(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task CreateEventAsync(CreateEventDto createEventDto, Guid userId)
        {
            var newEvent = new Event
            {
                Title = createEventDto.Title,
                Description = createEventDto.Description,
                EventDate = createEventDto.EventDate,
                Location = createEventDto.Location,
                UserId = userId
            };

            await _eventRepository.AddAsync(newEvent);
        }

        public async Task<PaginatedResult<EventDto>> GetAllEventsAsync(int pageNumber, int pageSize)
        {
            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(pageNumber, pageSize);

            var eventDtos = items.Select(e => new EventDto
            {
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location
            }).ToList();

            return new PaginatedResult<EventDto>
            {
                Items = eventDtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}
