using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
        string GenerateRefreshToken();
    }
}
