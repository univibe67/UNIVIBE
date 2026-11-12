namespace UniVibe.Domain.Entities
{
    public sealed class EventCategory : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public ICollection<Event> Events { get; set; } = new List<Event>();
    }

}
