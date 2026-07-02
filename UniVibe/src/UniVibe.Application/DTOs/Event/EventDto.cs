using Microsoft.AspNetCore.Http;

namespace UniVibe.Application.DTOs.Event
{
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public string? ImageUrl { get; set; }
    }
}
