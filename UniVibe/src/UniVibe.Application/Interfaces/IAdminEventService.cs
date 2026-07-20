using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminEventService
    {
        Task<List<EventListResponse>> GetPendingEventsAsync();
        Task<List<EventListResponse>> GetAllEventsAsync();
        Task<bool> ApproveEventAsync(Guid eventId);
        Task<bool> RejectEventAsync(Guid eventId, string reason);
        Task<EventDetailResponse> GetEventDetailsByIdAsync(Guid eventId);

    }
}
