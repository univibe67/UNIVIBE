namespace UniVibe.Application.Interfaces
{
    public interface IAuthService
    {
        Task<string> InitiateRegistrationAsync(string email);
        Task<bool> VerifyTokenAsync(string token); // Token doğrulamak için
    }
}
