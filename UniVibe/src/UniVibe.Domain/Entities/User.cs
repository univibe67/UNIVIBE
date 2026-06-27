using System.Diagnostics;
using UniVibe.Domain.Common;
using UniVibe.Domain.Enums;

namespace UniVibe.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public GradeLevel Grade { get; set; }

        public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
