using Microsoft.EntityFrameworkCore;

namespace UniVibe.Infrastructure.Persistence.Context
{
    public class UniVibeDbContext : DbContext
    {
        public UniVibeDbContext(DbContextOptions<UniVibeDbContext> options) : base(options)
        {
        }
    }
}
