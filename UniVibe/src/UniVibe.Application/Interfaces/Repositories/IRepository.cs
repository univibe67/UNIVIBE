using System.Linq.Expressions;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IRepository<T> where T: BaseEntity
    {
        Task AddAsync(T entity);
        void Delete(T entity);  
        void Update(T entity); 
        Task<T?> GetAsync(Expression<Func<T, bool>> filter);
        Task<List<T>> GetAllAsync(Expression<Func<T, bool>> filter = null);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
        IQueryable<T> AsQueryable();
    }
}
