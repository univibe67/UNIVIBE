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
            return await _context.Users
                .Include(u => u.Department)
                .ThenInclude(d => d.Faculty)
                .ThenInclude(f => f.University)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
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
                .IgnoreQueryFilters()
                .ToListAsync();
        }

    }
}
