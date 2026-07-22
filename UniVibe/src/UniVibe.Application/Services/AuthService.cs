using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AuthService : IAuthService
    {
        private readonly IPendingUserRepository _pendingUserRepository;
        private readonly IUserRepository _userRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUniversityRepository _universityRepository;
        private readonly IFacultyRepository _facultyRepository;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IConfiguration _configuration;
        private readonly IValidator<RegisterInitRequest> _registerInitValidator;
        private readonly IValidator<RegisterCompleteRequest> _registerCompleteValidator;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            IPendingUserRepository pendingUserRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IDepartmentRepository departmentRepository,
            IUniversityRepository universityRepository,
            IFacultyRepository facultyRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IConfiguration configuration,
            IValidator<RegisterInitRequest> registerInitValidator,
            IValidator<RegisterCompleteRequest> registerCompleteValidator,
            IHttpContextAccessor httpContextAccessor)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _departmentRepository = departmentRepository;
            _universityRepository = universityRepository;
            _facultyRepository = facultyRepository;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _configuration = configuration;
            _registerInitValidator = registerInitValidator;
            _registerCompleteValidator = registerCompleteValidator;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                throw new Exception(_localizer["Auth_InvalidCredentials"].Value);

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new Exception(_localizer["Auth_InvalidCredentials"].Value);

            if (!user.IsActive)
            {
                if (user.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - user.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        user.IsActive = true;
                        user.IsDeleted = false;
                        user.DeletedAt = null;
                    }
                    else
                    {
                        throw new Exception(_localizer["Auth_DeletedTooLong"].Value);
                    }
                }
                else
                {
                    throw new Exception(_localizer["Auth_Suspended"].Value);
                }
            }

            var token = _tokenService.GenerateToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(token, refreshToken, user.FirstName, user.LastName);
        }

        public async Task<string> InitiateRegistrationAsync(RegisterInitRequest request)
        {
            var validationResult = await _registerInitValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new Exception(string.Join(" • ", errors));
            }

            var existingUser = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                if (existingUser.IsActive)
                {
                    throw new Exception(_localizer["Auth_EmailAlreadyActive"].Value);
                }

                if (!existingUser.IsActive && existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = 15 - (int)gecenSure;
                        throw new Exception(_localizer["Auth_InDeletionProcess", kalanGun].Value);
                    }
                    else
                    {
                        string damga = Guid.NewGuid().ToString().Substring(0, 8);

                        existingUser.Email = $"deleted_{damga}@univibe.com";
                        existingUser.Username = $"deleted_user_{damga}";
                        existingUser.FirstName = "Silinmiş";
                        existingUser.LastName = "Kullanıcı";
                        existingUser.Bio = null;
                        existingUser.SocialMediaLink = null;
                        existingUser.ProfilePictureUrl = null;

                        _userRepository.Update(existingUser);
                    }
                }
            }

            var existingPending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingPending != null)
            {
                _pendingUserRepository.Delete(existingPending);
            }

            var token = Guid.NewGuid().ToString();
            var pendingUser = new PendingUser
            {
                Email = request.Email,
                Token = token,
                ExpiryDate = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };

            await _pendingUserRepository.AddAsync(pendingUser);
            await _unitOfWork.SaveChangesAsync();

            var httpContext = _httpContextAccessor.HttpContext;
            var userAgent = httpContext?.Request.Headers["User-Agent"].ToString().ToLower() ?? "";
            var clientPlatform = httpContext?.Request.Headers["X-Client-Platform"].ToString().ToLower() ?? "";

            bool isMobile = clientPlatform == "mobile" || userAgent.Contains("dart") || userAgent.Contains("react-native") || (!userAgent.Contains("mozilla") && !userAgent.Contains("chrome"));
            string targetUrl;

            if (isMobile)
            {
                string expoBaseUrl = _configuration["ExpoBaseUrl"] ?? "exp://localhost:8081";
                targetUrl = $"{expoBaseUrl}/--/register-complete";
            }
            else
            {
                string webBaseUrl = _configuration["WebBaseUrl"] ?? "https://univibe-three.vercel.app";
                targetUrl = $"{webBaseUrl}/register-complete";
            }

            try
            {
                var apiBaseUrl = _configuration["ApiBaseUrl"] ?? "https://uni-vibe-backend-orijinal-url.onrender.com";
                string linkForEmail;

                if (targetUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                {
                    linkForEmail = $"{targetUrl}?token={token}";
                }
                else
                {
                    linkForEmail = $"{apiBaseUrl}/api/Auth/verify-redirect?token={token}&redirectUrl={Uri.EscapeDataString(targetUrl)}";
                }

                string subject = _localizer["Auth_RegisterEmailSubject"].Value;
                string template = _localizer["Auth_RegisterEmailBody"].Value;
                string mailBody = string.Format(template, linkForEmail);

                await _emailService.SendEmailAsync(request.Email, subject, mailBody);
            }
            catch (Exception ex)
            {
                _pendingUserRepository.Delete(pendingUser);
                await _unitOfWork.SaveChangesAsync();
                throw new Exception(_localizer["Auth_EmailSendFailed", ex.Message].Value);
            }

            return _localizer["Res_Auth_LinkSent"].Value;
        }

        public async Task<bool> VerifyTokenAsync(string token)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == token && !u.IsUsed);
            if (pendingUser == null || pendingUser.ExpiryDate < DateTime.UtcNow)
            {
                return false;
            }
            return true;
        }

        public async Task<LoginResponse> CompleteRegistrationAsync(RegisterCompleteRequest request)
        {
            var validationResult = await _registerCompleteValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new Exception(string.Join(" • ", errors));
            }

            if (string.IsNullOrWhiteSpace(request.Token))
                throw new Exception(_localizer["Auth_InvalidToken"].Value);

            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == request.Token && !u.IsUsed);
            if (pendingUser == null)
                throw new Exception(_localizer["Auth_InvalidToken"].Value);
            if (pendingUser.ExpiryDate < DateTime.UtcNow)
                throw new Exception(_localizer["Auth_TokenExpired"].Value);

            var isUsernameTaken = await _userRepository.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
            if (isUsernameTaken)
                throw new Exception(_localizer["Auth_UsernameTaken"].Value);

            var department = await _departmentRepository.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
            if (department == null)
                throw new Exception(_localizer["Auth_DepartmentNotFound"].Value);

            var assignedRole = UserRole.Student;
            if (pendingUser.Email.Contains("@beun.edu.tr"))
            {
                assignedRole = UserRole.Teacher;
            }
            if (assignedRole == UserRole.Student)
            {
                if (!request.Grade.HasValue)
                    throw new Exception(_localizer["Auth_StudentGradeReq"].Value);

                request.Title = null;
            }
            if (assignedRole == UserRole.Teacher)
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                    throw new Exception(_localizer["Auth_TeacherTitleReq"].Value);

                request.Grade = null;
            }

            var newUser = new User
            {
                Username = request.Username,
                Email = pendingUser.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Title = request.Title,
                DepartmentId = request.DepartmentId,
                Grade = request.Grade,
                Role = assignedRole,
                IsActive = true,
                ProfilePictureUrl = $"https://ui-avatars.com/api/?name={request.FirstName}+{request.LastName}&background=random&color=fff",

                RefreshToken = _tokenService.GenerateRefreshToken(),
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30)
            };

            await _userRepository.AddAsync(newUser);
            _pendingUserRepository.Delete(pendingUser);
            await _unitOfWork.SaveChangesAsync();

            var accessToken = _tokenService.GenerateToken(newUser);
            return new LoginResponse(accessToken, newUser.RefreshToken, newUser.FirstName, newUser.LastName);
        }

        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new Exception(_localizer["Auth_SessionExpired"].Value);

            var newAccessToken = _tokenService.GenerateToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(newAccessToken, newRefreshToken, user.FirstName, user.LastName);
        }

        public async Task<string> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user != null)
            {
                var resetToken = Guid.NewGuid().ToString();
                user.PasswordResetToken = resetToken;
                user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

                _userRepository.Update(user);
                await _unitOfWork.SaveChangesAsync();

                var defaultWebUrl = _configuration["WebBaseUrl"] ?? "https://univibe-three.vercel.app";
                var baseUrl = !string.IsNullOrEmpty(request.ResetUrl) ? request.ResetUrl : $"{defaultWebUrl}/reset-password";
                var resetLink = $"{baseUrl}?email={user.Email}&token={resetToken}";

                string subject = _localizer["Auth_ResetEmailSubject"].Value;
                string template = _localizer["Auth_ResetEmailBody"].Value;
                string mailBody = string.Format(template, resetLink);

                try
                {
                    await _emailService.SendEmailAsync(user.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    throw new Exception(_localizer["Auth_EmailSendFailed", ex.Message].Value);
                }
            }

            return _localizer["Auth_ResetLinkSent"].Value;
        }

        public async Task<string> ResetPasswordAsync(ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                throw new Exception(_localizer["Auth_InvalidOrExpiredToken"].Value);

            var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || user.PasswordResetToken != request.Token || user.ResetTokenExpires < DateTime.UtcNow)
            {
                throw new Exception(_localizer["Auth_InvalidOrExpiredToken"].Value);
            }

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Auth_PasswordResetSuccessful"].Value;
        }
    }
}