using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.User.Responses
{
    public class PublicUserProfileResponse
    {
        public Guid Id { get; set; }
        public  string? Username { get; set; }
        public  string? FirstName { get; set; } 
        public  string? LastName { get; set; } 
        public string? ProfilePictureUrl { get; set; }
        public string? Bio { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }
        public GradeLevel? Grade { get; set; }
        public string? Title { get; set; }
        public UserRole Role { get; set; }
        public string? SocialMediaLink { get; set; }
        public string? Department { get; set; }
        public string? Faculty { get; set; }
        public string? University { get; set; }
    }
}