using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetUserWithDetailsByUsernameAsync(string username);
        Task<User?> GetUserWithDetailsByIdAsync(Guid userId);
        Task<List<User>> GetAllIncludingDeletedAsync();
    }
}
