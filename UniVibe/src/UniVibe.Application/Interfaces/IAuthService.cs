using UniVibe.Application.DTOs.Auth;

namespace UniVibe.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string> InitiateRegistrationAsync(string email);
        Task<bool> VerifyTokenAsync(string token);
        Task<LoginResponse> CompleteRegistrationAsync(RegisterCompleteRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
    }
}
