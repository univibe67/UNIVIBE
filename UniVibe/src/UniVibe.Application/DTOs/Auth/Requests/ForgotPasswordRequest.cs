namespace UniVibe.Application.DTOs.Auth.Requests
{
    public class ForgotPasswordRequest
    {
        public string Email { get; set; }

        public string ResetUrl { get; set; }
    }

}


