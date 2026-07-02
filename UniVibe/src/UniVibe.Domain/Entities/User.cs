using System.Diagnostics;
using UniVibe.Domain.Common;
using UniVibe.Domain.Enums;

namespace UniVibe.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public DateTime? LastUsernameUpdatedAt { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public GradeLevel Grade { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? ProfilePicturePublicId { get; set; }
        public string? Bio { get; set; }
        public string? SocialMediaLink { get; set; }

        public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
