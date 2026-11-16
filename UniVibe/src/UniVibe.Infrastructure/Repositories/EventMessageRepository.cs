using Microsoft.EntityFrameworkCore;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public sealed class EventMessageRepository : Repository<EventMessage>, IEventMessageRepository
    {
        public EventMessageRepository(UniVibeDbContext context) : base(context)
        {
        }
        public async Task<List<EventMessage>> GetMessagesByEventIdAsync(Guid eventId, int pageNumber, int pageSize)
        {
            return await _context.EventMessages
                .AsNoTracking()
                .Include(em => em.User)
                .Where(em => em.EventId == eventId && !em.IsDeleted)
                .OrderByDescending(em => em.CreatedAt)
                .Skip((pageNumber - 1) * pageSize) 
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<EventMessage?> GetByIdWithUserAsync(Guid id)
        {
            return await _context.EventMessages
                .AsNoTracking()
                .Include(em => em.User)
                .FirstOrDefaultAsync(em => em.Id == id && !em.IsDeleted);
        }
        public async Task<EventMessage?> GetLastMessageByEventIdAsync(Guid eventId, Guid userId)
        {
            return await _context.EventMessages
                .AsNoTracking()
                .Where(em => em.EventId == eventId && em.UserId == userId && !em.IsDeleted)
                .OrderByDescending(em => em.CreatedAt)
                .FirstOrDefaultAsync();
        }
    }
}