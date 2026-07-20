using Microsoft.EntityFrameworkCore;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class EventRepository : Repository<Event>, IEventRepository
    {
        public EventRepository(UniVibeDbContext context) : base(context) { }

        public async Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(int pageNumber, int pageSize, bool onlyActive = true)
        {
            var query = _context.Events.Where(e => !e.IsDeleted).AsQueryable();

            if (onlyActive)
            {
                query = query.Where(e => e.IsActive &&
                                         e.EventDate >= DateTime.UtcNow &&
                                         e.Status == EventStatus.Approved);
            }


            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
        public async Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId)
        {
            return await _context.Events
                .Include(e => e.User)
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e => e.Id == eventId);
        }
        public async Task<Event?> GetActiveEventByUserIdAsync(Guid userId)
        {
            return await _context.Events
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e =>
                    e.UserId == userId &&
                    e.EventDate > DateTime.UtcNow &&
                    e.IsDeleted == false);
        }
        public async Task<List<Event>> GetAllWithUsersAsync()
        {
            return await _context.Events
                .Include(e => e.User)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

    }
}
