using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class Repository<T> : IRepository<T> where T : BaseEntity
    {
        protected readonly UniVibeDbContext _context;
        private readonly DbSet<T> _dbSet;

        public Repository(UniVibeDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }

        public void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        public async Task<T?> GetAsync(Expression<Func<T, bool>> filter)
        {
            return await _dbSet.SingleOrDefaultAsync(filter);
        }

        public async Task<List<T>> GetAllAsync(Expression<Func<T, bool>>? filter = null, bool trackChanges = false)
        {
            IQueryable<T> query = _dbSet;

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            if (filter != null)
            {
                query = query.Where(filter);
            }

            return await query.ToListAsync();
        }

        public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, bool trackChanges = false)
        {
            IQueryable<T> query = _dbSet;
            if (!trackChanges)
                query = query.AsNoTracking();

            return await query.FirstOrDefaultAsync(predicate);
        }

        public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.AnyAsync(predicate);
        }

        public IQueryable<T> AsQueryable()
        {
            return _dbSet.AsQueryable();
        }
    }
}