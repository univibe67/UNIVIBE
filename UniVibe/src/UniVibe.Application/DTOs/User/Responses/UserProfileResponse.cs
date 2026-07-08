namespace UniVibe.Application.DTOs.User.Responses 
{
    public class UserProfileResponse
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? SocialMediaLink { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string UniversityName { get; set; } = string.Empty;
        public string FacultyName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
    }
}