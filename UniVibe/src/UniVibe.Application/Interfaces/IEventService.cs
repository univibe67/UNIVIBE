using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IEventService
    {
        Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(GetAllEventsRequest request);
        Task<string> CreateEventAsync(CreateEventRequest request, Guid userId);
        Task<List<EventCategoryResponse>> GetCategoriesAsync();
        Task<string> DeleteEventAsync(Guid eventId, Guid userId);
        Task<EventDetailResponse> GetEventByIdAsync(Guid eventId, Guid currentUserId);
        Task<EventDetailResponse?> GetMyActiveEventAsync(Guid userId);
    }
}
