namespace UniVibe.Application.DTOs.Event.Responses
{
    public class EventDetailResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CreatorName { get; set; } = string.Empty;
        public bool IsCreator { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsDeleted { get; set; }
        public string? CancellationReason { get; set; }

    }
}
