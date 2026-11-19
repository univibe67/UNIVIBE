using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class AcademicDirectoryRepository : Repository<AcademicDirectory>, IAcademicDirectoryRepository
    {
        public AcademicDirectoryRepository(UniVibeDbContext context) : base(context)
        {
        }
    }
}
