using UniVibe.Application.DTOs.Auth;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IPendingUserRepository _pendingUserRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;


        public AuthService(IPendingUserRepository pendingUserRepository, IEmailService emailService, IUserRepository userRepository, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                throw new Exception("E-posta veya şifre hatalı.");

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new Exception("E-posta veya şifre hatalı.");

            var token = _tokenService.GenerateToken(user);

            return new LoginResponse(token, user.FirstName, user.LastName);
        }

        public async Task<string> InitiateRegistrationAsync(string email)
        {
            var alreadyRegistered = await _userRepository.FirstOrDefaultAsync(u => u.Email == email);
            if (alreadyRegistered != null)
                throw new Exception("Bu e-posta adresi ile zaten kayıtlı bir kullanıcı bulunuyor.");

            var existingPending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == email);
            if (existingPending != null)
            {
                await _pendingUserRepository.DeleteAsync(existingPending);
            }

            var token = Guid.NewGuid().ToString();
            var pendingUser = new PendingUser
            {
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
                await _pendingUserRepository.DeleteAsync(pendingUser);
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
                Email = pendingUser.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
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
