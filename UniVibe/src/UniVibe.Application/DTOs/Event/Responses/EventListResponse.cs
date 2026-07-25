using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.Event.Responses
{
    public class EventListResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; } 
        public string Location { get; set; } = string.Empty;
        public EventStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public int ParticipantCount { get; set; }
    }
}
