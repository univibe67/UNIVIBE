using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminEventService
    {
        Task<List<Event>> GetPendingEventsAsync();
        Task<bool> ApproveEventAsync(Guid eventId);
        Task<bool> RejectEventAsync(Guid eventId);
        Task<List<Event>> GetAllEventsAsync();
    }
}
