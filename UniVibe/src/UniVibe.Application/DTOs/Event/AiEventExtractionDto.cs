namespace UniVibe.Application.DTOs.Event
{
    public class AiEventExtractionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime? EventDate { get; set; }
    }
}
