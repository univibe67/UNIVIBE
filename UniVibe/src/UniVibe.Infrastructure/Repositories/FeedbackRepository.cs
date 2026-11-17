using Microsoft.EntityFrameworkCore;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class FeedbackRepository : Repository<Feedback>, IFeedbackRepository
    {
        public FeedbackRepository(UniVibeDbContext context) : base(context) { }

        public async Task<List<Feedback>> GetAllFeedbacksWithUserAsync()
        {
            return await _context.Set<Feedback>()
                .AsNoTracking()
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<Feedback?> GetFeedbackWithUserByIdAsync(Guid id, bool trackChanges = false)
        {
            var query = _context.Set<Feedback>()
                .Include(f => f.User)
                .AsQueryable();

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(f => f.Id == id);
        }
        public async Task<int> GetTodayFeedbackCountByUserIdAsync(Guid userId)
        {
            var todayUtc = DateTime.UtcNow.Date; 

            return await _context.Set<Feedback>()
                .CountAsync(f => f.UserId == userId && f.CreatedAt >= todayUtc && !f.IsDeleted);
        }
    }
}
