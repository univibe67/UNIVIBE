namespace UniVibe.Application.DTOs.Event
{
    public class CreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
    }
}
