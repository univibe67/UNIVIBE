using System.ComponentModel.DataAnnotations.Schema;
using UniVibe.Domain.Common;

namespace UniVibe.Domain.Entities
{
    public class Event : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Location { get; set; } = string.Empty;
        public string? TargetDepartment { get; set; } 
        public string? TargetFaculty { get; set; }
        public int? MinGrade { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImagePublicId { get; set; }

        public Guid UserId { get; set; }
        public virtual User User { get; set; } = default!;

        public Guid CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public EventCategory Category { get; set; } = default!;
    }

}
