using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Interfaces
{
    public interface IEventService
    {
        Task<List<EventDto>> GetAllEventsAsync();
        Task CreateEventAsync(CreateEventDto createEventDto, Guid userId);
    }
}
