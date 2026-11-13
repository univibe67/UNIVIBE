namespace UniVibe.Application.DTOs.Feedback.Request
{
    public class CreateFeedbackDto
    {
        public required string Subject { get; set; }
        public required string Message { get; set; }
    }
}
