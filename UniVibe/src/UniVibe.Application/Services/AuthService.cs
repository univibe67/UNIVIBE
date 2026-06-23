using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<PendingUser> _pendingUserRepository;

        public AuthService(IGenericRepository<PendingUser> pendingUserRepository)
        {
            _pendingUserRepository = pendingUserRepository;
        }

        public async Task<string> InitiateRegistrationAsync(string email)
        {
            // 1. Zaten kayıtlı mı kontrolü (GenericRepository'de FirstOrDefaultAsync varsa)
            var existing = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email && !u.IsUsed);

            if (existing != null && existing.ExpiryDate > DateTime.UtcNow)
                return existing.Token;

            // 2. Yeni Token
            var token = Guid.NewGuid().ToString();
            var pendingUser = new PendingUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                Token = token,
                ExpiryDate = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await _pendingUserRepository.AddAsync(pendingUser);
            return token;
        }

        public async Task<bool> VerifyTokenAsync(string token)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == token && !u.IsUsed);
            if (pendingUser == null || pendingUser.ExpiryDate < DateTime.UtcNow)
            {
                return false;
            }

            pendingUser.IsUsed = true;

            await _pendingUserRepository.UpdateAsync(pendingUser);

            return true;
        }
    }
}
