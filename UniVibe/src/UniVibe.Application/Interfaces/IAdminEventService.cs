using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminEventService
    {
        Task<PaginatedResult<EventListResponse>> GetPendingEventsAsync(int pageNumber = 1, int pageSize = 10);
        Task<PaginatedResult<EventListResponse>> GetAllEventsAsync(int pageNumber = 1, int pageSize = 10);
        Task<string> ApproveEventAsync(Guid eventId);
        Task<string> RejectEventAsync(Guid eventId, string reason);
        Task<EventDetailResponse> GetEventDetailsByIdAsync(Guid eventId);
    }
}