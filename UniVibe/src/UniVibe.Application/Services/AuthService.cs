using UniVibe.Application.DTOs.Auth;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<PendingUser> _pendingUserRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly IEmailService _emailService;

        public AuthService(IGenericRepository<PendingUser> pendingUserRepository, IEmailService emailService, IGenericRepository<User> userRepository)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
        }

        public async Task<string> InitiateRegistrationAsync(string email)
        {
            var alreadyRegistered = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email && u.IsUsed);
            if (alreadyRegistered != null)
                throw new Exception("Bu e-posta adresi ile zaten kayıtlı bir kullanıcı bulunuyor.");

            var pending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email && !u.IsUsed);

            if (pending != null && pending.ExpiryDate > DateTime.UtcNow)
                return pending.Token;

            // 3. ADIM: Yeni kayıt oluştur
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

            try
            {
                string link = $"https://localhost:7001/api/Auth/verify-token?token={token}";
                await _emailService.SendEmailAsync(email, "UniVibe Kayıt", $"Link: <a href='{link}'>Doğrula</a>");
            }
            catch (Exception ex)
            {
                throw new Exception("Mail gönderilemedi, lütfen bilgileri kontrol et. Hata: " + ex.Message);
            }

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

        public async Task CompleteRegistrationAsync(RegisterCompleteRequest request)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == request.Token && u.IsUsed);

            if (pendingUser == null)
                throw new Exception("Geçersiz işlem.");

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Email = pendingUser.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber, 
                Department = request.Department,
                Faculty = request.Faculty,
                Grade = request.Grade
            };

            await _userRepository.AddAsync(newUser);
            await _pendingUserRepository.DeleteAsync(pendingUser);
        }
    }
}
