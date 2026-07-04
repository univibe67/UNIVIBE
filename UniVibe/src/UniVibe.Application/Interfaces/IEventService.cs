using UniVibe.Application.Constants;
using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Interfaces
{
    public interface IEventService
    {
        Task<PaginatedResult<EventDto>> GetAllEventsAsync(int pageNumber, int pageSize, bool onlyActive = true);
        Task CreateEventAsync(CreateEventDto createEventDto, Guid userId);
        Task<List<EventCategoryDto>> GetCategoriesAsync();
        Task DeleteEventAsync(Guid eventId, Guid userId);
    }
}
