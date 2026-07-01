using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IEventRepository : IGenericRepository<Event>
    {
        Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(int pageNumber, int pageSize, bool onlyActive = true);
    }
}
