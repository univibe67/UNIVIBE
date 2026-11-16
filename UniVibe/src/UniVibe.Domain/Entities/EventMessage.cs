namespace UniVibe.Domain.Entities
{
    public sealed class EventMessage : BaseEntity
    {
        public string Content { get; set; } = string.Empty;
        public bool IsEdited { get; set; } = false;

        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
