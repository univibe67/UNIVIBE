using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class PendingUserRepository : GenericRepository<PendingUser>, IPendingUserRepository
    {
        public PendingUserRepository(UniVibeDbContext context) : base(context) { }

    }
}
