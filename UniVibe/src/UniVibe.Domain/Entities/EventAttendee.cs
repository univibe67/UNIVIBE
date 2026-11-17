namespace UniVibe.Domain.Entities
{
    public class EventAttendee : BaseEntity
    {
        public DateTime? JoinedAt { get; set; } = DateTime.UtcNow;
        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
