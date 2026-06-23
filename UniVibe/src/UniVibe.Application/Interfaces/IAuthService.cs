using UniVibe.Application.DTOs.Auth;

namespace UniVibe.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string> InitiateRegistrationAsync(string email);
        Task<bool> VerifyTokenAsync(string token);
        Task CompleteRegistrationAsync(RegisterCompleteRequest request);
    }
}
