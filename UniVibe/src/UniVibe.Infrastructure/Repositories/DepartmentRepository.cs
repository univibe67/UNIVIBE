using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class DepartmentRepository : Repository<Department>, IDepartmentRepository
    {
        public DepartmentRepository(UniVibeDbContext context) : base(context)
        {
        }
    }
}
