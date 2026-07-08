namespace UniVibe.Application.DTOs.User.Responses
{
    public class PublicUserProfileResponse
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? SocialMediaLink { get; set; }
        public string Department { get; set; } = string.Empty;
        public string Faculty { get; set; } = string.Empty;
    }
}