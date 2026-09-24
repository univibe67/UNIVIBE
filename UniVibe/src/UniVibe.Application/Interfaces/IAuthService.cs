using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string> InitiateRegistrationAsync(RegisterInitRequest request);
        Task<bool> VerifyTokenAsync(string token);
        Task<LoginResponse> CompleteRegistrationAsync(RegisterCompleteRequest request);
        Task<LoginResponse> LoginAsync(LoginRequest request);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task<string> ForgotPasswordAsync(ForgotPasswordRequest request);
        Task<string> ResetPasswordAsync(ResetPasswordRequest request);
    }
}