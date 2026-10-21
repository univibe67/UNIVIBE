using UniVibe.Application.DTOs.Feedback.Request;
using UniVibe.Application.DTOs.Feedback.Response;

namespace UniVibe.Application.Interfaces
{
    public interface IFeedbackService
    {
        Task<List<FeedbackResponseDto>> GetAllFeedbacksAsync();
        Task<string> CreateFeedbackAsync(Guid userId, CreateFeedbackDto dto);
        Task<string> ResolveFeedbackAsync(Guid feedbackId);
    }
}