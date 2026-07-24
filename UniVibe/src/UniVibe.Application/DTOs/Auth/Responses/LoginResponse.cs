namespace UniVibe.Application.DTOs.Auth.Responses
{
    public class LoginResponse
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }

        public LoginResponse(string token, string refreshToken, string firstName, string lastName)
        {
            Token = token;
            RefreshToken = refreshToken;
            FirstName = firstName;
            LastName = lastName;
        }
    }

}


