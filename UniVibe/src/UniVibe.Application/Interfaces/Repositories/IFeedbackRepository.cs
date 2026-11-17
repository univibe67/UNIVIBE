using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IFeedbackRepository : IRepository<Feedback>
    {
        Task<List<Feedback>> GetAllFeedbacksWithUserAsync();
        Task<Feedback?> GetFeedbackWithUserByIdAsync(Guid id, bool trackChanges = false);
        Task<int> GetTodayFeedbackCountByUserIdAsync(Guid userId);
    }
}