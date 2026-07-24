namespace UniVibe.Application.DTOs.User.Requests
{
    public class UpdateUserProfileRequest
    {
        public string? Username { get; set; }
        public string? Bio { get; set; }
        public string? SocialMediaLink { get; set; }
    }
}
