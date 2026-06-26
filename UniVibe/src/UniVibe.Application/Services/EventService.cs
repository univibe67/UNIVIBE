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

        public async Task<List<EventDto>> GetAllEventsAsync()
        {
            var events = await _eventRepository.GetAllAsync();

            return events.Select(e => new EventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                EventDate = e.EventDate,
                Location = e.Location
            }).ToList();
        }
    }
}
