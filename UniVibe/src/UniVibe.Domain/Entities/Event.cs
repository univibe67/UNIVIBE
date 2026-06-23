using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class Event : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;

        public Guid UserId { get; set; }
        public virtual User User { get; set; } = default!;
    }
}
