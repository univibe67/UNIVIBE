using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class EventRepository : GenericRepository<Event>, IEventRepository
    {
        public EventRepository(UniVibeDbContext context) : base(context) { }

    }
}
