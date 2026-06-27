using System.Linq.Expressions;
using UniVibe.Domain.Common;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IGenericRepository<T> where T: BaseEntity
    {
        Task AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(T entity);

        Task<T?> GetAsync(Expression<Func<T, bool>> filter);
        Task<List<T>> GetAllAsync(Expression<Func<T, bool>> filter = null);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    }
}
