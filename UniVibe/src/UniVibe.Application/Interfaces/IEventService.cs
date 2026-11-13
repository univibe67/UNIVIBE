using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IEventService
    {
        Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(GetAllEventsRequest request, Guid currentUserId);
        Task<string> CreateEventAsync(CreateEventRequest request, Guid userId);
        Task<List<EventCategoryResponse>> GetCategoriesAsync();
        Task<EventDetailResponse> GetEventByIdAsync(Guid eventId, Guid currentUserId);
        Task<EventDetailResponse?> GetMyActiveEventAsync(Guid userId);
        Task<List<EventDetailResponse>> GetMyJoinedEventsAsync(Guid userId);
        Task<string> JoinEventAsync(Guid eventId, Guid userId);
        Task<string> CancelEventAsync(Guid eventId, Guid userId, CancelEventRequest request);
        Task<List<ParticipantResponse>> GetEventParticipantsAsync(Guid eventId);
        Task<string> LeaveEventAsync(Guid eventId, Guid userId);
        Task<EventStatisticsResponse> GetEventStatisticsAsync();
    }
}
