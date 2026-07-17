using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IEventRepository : IRepository<Event>
    {
        Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(int pageNumber, int pageSize, bool onlyActive = true);
        Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId);
        Task<Event?> GetActiveEventByUserIdAsync(Guid userId);
        Task<List<Event>> GetAllWithUsersAsync();
    }
}
