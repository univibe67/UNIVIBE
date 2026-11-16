using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.DTOs.Message.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IEventMessageService
    {
        Task<EventMessageResponse> SendMessageAsync(Guid eventId, Guid userId, SendMessageRequest request);
        Task<List<EventMessageResponse>> GetMessagesAsync(Guid eventId, Guid userId, int pageNumber, int pageSize);
    }
}
