namespace UniVibe.Application.DTOs.Message.Responses
{
    public class EventMessageResponse
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderProfileImage { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}