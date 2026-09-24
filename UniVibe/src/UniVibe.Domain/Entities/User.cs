using UniVibe.Domain.Enums;

namespace UniVibe.Domain.Entities
{
    public sealed class User : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public DateTime? LastUsernameUpdatedAt { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public GradeLevel? Grade { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? ProfilePicturePublicId { get; set; }
        public string? Bio { get; set; }
        public string? SocialMediaLink { get; set; }
        public string? RefreshToken { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }
        public string? Title { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public DateTime? DeletedAt { get; set; }
        public UserRole Role { get; set; } = UserRole.Student;

        public Guid DepartmentId { get; set; }
        public Department Department { get; set; } = null!;
        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
