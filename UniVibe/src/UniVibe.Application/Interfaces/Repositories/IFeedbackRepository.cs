using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IFeedbackRepository : IRepository<Feedback> // Projendeki generic repository interface adın neyse (örn: IGenericRepository veya IRepository)
    {
        Task<List<Feedback>> GetAllFeedbacksWithUserAsync();
        Task<Feedback?> GetFeedbackWithUserByIdAsync(Guid id);
        Task<int> GetTodayFeedbackCountByUserIdAsync(Guid userId);
    }
}