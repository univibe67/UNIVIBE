namespace UniVibe.Application.DTOs.Message.Requests
{
    public class SendMessageRequest
    {
        public string Content { get; set; } = string.Empty;

        public SendMessageRequest() { }

        public SendMessageRequest(string content)
        {
            Content = content;
        }
    }
}