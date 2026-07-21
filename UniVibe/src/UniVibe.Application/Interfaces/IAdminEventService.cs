using UniVibe.Application.DTOs.Event.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminEventService
    {
        Task<List<EventListResponse>> GetPendingEventsAsync();
        Task<List<EventListResponse>> GetAllEventsAsync();
        Task<string> ApproveEventAsync(Guid eventId);
        Task<string> RejectEventAsync(Guid eventId, string reason);
        Task<EventDetailResponse> GetEventDetailsByIdAsync(Guid eventId);
    }
}