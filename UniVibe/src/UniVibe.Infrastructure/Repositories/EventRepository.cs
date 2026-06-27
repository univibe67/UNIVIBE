using Microsoft.EntityFrameworkCore;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class EventRepository : GenericRepository<Event>, IEventRepository
    {
        public EventRepository(UniVibeDbContext context) : base(context) { }

        public async Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(int pageNumber, int pageSize)
        {
            var totalCount = await _context.Events.CountAsync();

            var items = await _context.Events
                .OrderByDescending(e => e.CreatedAt) 
                .Skip((pageNumber - 1) * pageSize)     
                .Take(pageSize)                        
                .ToListAsync();

            return (items, totalCount);
        }

    }
}
