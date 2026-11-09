namespace UniVibe.Application.DTOs.Auth.Responses
{
    public class LoginResponse
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public Guid UserId { get; set; }              
        public string Role { get; set; }               
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? ProfilePictureUrl { get; set; } 

        public LoginResponse(string token, string refreshToken, Guid userId, string role, string firstName, string lastName, string? profilePictureUrl)
        {
            Token = token;
            RefreshToken = refreshToken;
            UserId = userId;
            Role = role;
            FirstName = firstName;
            LastName = lastName;
            ProfilePictureUrl = profilePictureUrl;
        }
    }
}