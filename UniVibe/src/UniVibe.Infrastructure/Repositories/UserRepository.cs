using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(UniVibeDbContext context) : base(context) { }

    }
}
