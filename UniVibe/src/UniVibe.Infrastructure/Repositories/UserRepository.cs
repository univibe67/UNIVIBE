using Microsoft.EntityFrameworkCore;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(UniVibeDbContext context) : base(context) { }

        public async Task<User?> GetUserWithDetailsByUsernameAsync(string username)
        {
            var normalizedUsername = username.ToLowerInvariant();

            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Department)
                    .ThenInclude(d => d.Faculty)
                        .ThenInclude(f => f.University)
                .FirstOrDefaultAsync(u => u.Username == normalizedUsername);
        }

        public async Task<User?> GetUserWithDetailsByIdAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.Department)
                    .ThenInclude(d => d.Faculty)
                        .ThenInclude(f => f.University)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<List<User>> GetAllIncludingDeletedAsync()
        {
            return await _context.Set<User>()
                .AsNoTracking() 
                .Include(u => u.Department)
                    .ThenInclude(d => d.Faculty)
                        .ThenInclude(f => f.University)
                .IgnoreQueryFilters()
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<User?> GetByIdIncludingDeletedAsync(Guid id)
        {
            return await _context.Set<User>()
                .Include(u => u.Department)
                    .ThenInclude(d => d.Faculty)
                        .ThenInclude(f => f.University)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetByEmailIncludingDeletedAsync(string email)
        {
            var normalizedEmail = email.ToLowerInvariant();

            return await _context.Set<User>()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        }

        public async Task<bool> IsUsernameTakenAsync(string username)
        {
            var normalizedUsername = username.ToLowerInvariant();
            return await _context.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Username == normalizedUsername);
        }
        public async Task<(List<User> Items, int TotalCount)> GetPagedUsersIncludingDeletedAsync(int pageNumber, int pageSize)
        {
            var query = _context.Set<User>()
                .AsNoTracking()
                .Include(u => u.Department)
                    .ThenInclude(d => d.Faculty)
                        .ThenInclude(f => f.University)
                .IgnoreQueryFilters()
                .OrderByDescending(u => u.CreatedAt)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}