using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Interfaces
{
    public interface IEventService
    {
        Task<PaginatedResult<EventDto>> GetAllEventsAsync(int pageNumber, int pageSize, bool onlyActive = true);
        Task CreateEventAsync(CreateEventDto createEventDto, Guid userId);
        Task<List<EventCategoryDto>> GetCategoriesAsync();
        Task DeleteEventAsync(Guid eventId, Guid userId);
        Task<EventDto> GetEventByIdAsync(Guid eventId, Guid currentUserId);
        Task<EventDto?> GetMyActiveEventAsync(Guid userId);
    }
}
