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
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<Feedback?> GetFeedbackWithUserByIdAsync(Guid id)
        {
            return await _context.Set<Feedback>()
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.Id == id);
        }
        public async Task<int> GetTodayFeedbackCountByUserIdAsync(Guid userId)
        {
            var todayUtc = DateTime.UtcNow.Date; // Bugünün başlangıç saati (UTC)

            return await _context.Set<Feedback>()
                .CountAsync(f => f.UserId == userId && f.CreatedAt >= todayUtc && !f.IsDeleted);
        }
    }
}
