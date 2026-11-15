using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Exceptions;
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
        private readonly IFacultyRepository _facultyRepository;
        private readonly IUniversityRepository _universityRepository;
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
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IConfiguration configuration,
            IValidator<RegisterInitRequest> registerInitValidator,
            IValidator<RegisterCompleteRequest> registerCompleteValidator,
            IHttpContextAccessor httpContextAccessor,
            IFacultyRepository facultyRepository,
            IUniversityRepository universityRepository)
        {
            _pendingUserRepository = pendingUserRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _departmentRepository = departmentRepository;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _configuration = configuration;
            _registerInitValidator = registerInitValidator;
            _registerCompleteValidator = registerCompleteValidator;
            _httpContextAccessor = httpContextAccessor;
            _facultyRepository = facultyRepository;
            _universityRepository = universityRepository;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailIncludingDeletedAsync(request.Email);

            if (user == null)
                throw new UnauthorizedException(_localizer["Auth_InvalidCredentials"].Value);

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new UnauthorizedException(_localizer["Auth_InvalidCredentials"].Value);

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
                        throw new BadRequestException(_localizer["Auth_DeletedTooLong"].Value);
                    }
                }
                else
                {
                    throw new BadRequestException(_localizer["Auth_Suspended"].Value);
                }
            }

            var token = _tokenService.GenerateToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(token, refreshToken, user.Id, user.Role.ToString(), user.FirstName, user.LastName, user.ProfilePictureUrl);
        }

        public async Task<string> InitiateRegistrationAsync(RegisterInitRequest request)
        {
            await _registerInitValidator.ValidateAndThrowCustomAsync(request);

            var existingUser = await _userRepository.GetByEmailIncludingDeletedAsync(request.Email);

            if (existingUser != null)
            {
                if (existingUser.IsActive)
                {
                    throw new ConflictException(_localizer["Auth_EmailAlreadyActive"].Value);
                }

                if (!existingUser.IsActive && existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = 15 - (int)gecenSure;
                        throw new BadRequestException(_localizer["Auth_InDeletionProcess", kalanGun].Value);
                    }
                    else
                    {
                        existingUser.FirstName = "Silinmiş";
                        existingUser.LastName = "Kullanıcı";
                        existingUser.Bio = null;
                        existingUser.SocialMediaLink = null;
                        existingUser.ProfilePictureUrl = null;
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
                var apiBaseUrl = _configuration["ApiBaseUrl"] ?? "http://localhost:5000";
                string linkForEmail;

                if (targetUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) && !targetUrl.Contains("localhost"))
                {
                    linkForEmail = $"{targetUrl}?token={token}";
                }
                else
                {
                    linkForEmail = $"{apiBaseUrl}/api/auth/verification/redirect?token={token}&redirectUrl={Uri.EscapeDataString(targetUrl)}";
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
                throw new BadRequestException(_localizer["Auth_EmailSendFailed", ex.Message].Value);
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
            await _registerCompleteValidator.ValidateAndThrowCustomAsync(request);

            if (string.IsNullOrWhiteSpace(request.Token))
                throw new BadRequestException(_localizer["Auth_InvalidToken"].Value);

            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == request.Token && !u.IsUsed);
            if (pendingUser == null)
                throw new BadRequestException(_localizer["Auth_InvalidToken"].Value);
            if (pendingUser.ExpiryDate < DateTime.UtcNow)
                throw new BadRequestException(_localizer["Auth_TokenExpired"].Value);

            var isUsernameTaken = await _userRepository.IsUsernameTakenAsync(request.Username);
            if (isUsernameTaken)
                throw new ConflictException(_localizer["Auth_UsernameTaken"].Value);

            var email = pendingUser.Email.ToLowerInvariant();
            var parts = email.Split('@');
            if (parts.Length != 2)
                throw new BadRequestException(_localizer["Auth_InvalidEmailFormat"].Value);

            var emailDomain = parts[1];

            UserRole assignedRole;
            University? matchedUniversity = null;
            string facultyCode = string.Empty;
            Guid? finalDepartmentId = null;

            var universities = await _universityRepository.GetAllAsync();

            var studentUni = universities.FirstOrDefault(u => !string.IsNullOrEmpty(u.StudentEmailDomain) && emailDomain.EndsWith(u.StudentEmailDomain, StringComparison.OrdinalIgnoreCase));
            var teacherUni = universities.FirstOrDefault(u => !string.IsNullOrEmpty(u.AcademicEmailDomain) && emailDomain.EndsWith(u.AcademicEmailDomain, StringComparison.OrdinalIgnoreCase));

            if (studentUni != null)
            {
                assignedRole = UserRole.Student;
                matchedUniversity = studentUni;

                var domainParts = emailDomain.Split('.');
                if (domainParts.Length >= 3)
                {
                    facultyCode = domainParts[0];
                }

                if (string.IsNullOrEmpty(facultyCode))
                {
                    throw new BadRequestException(_localizer["Auth_InvalidEmailFormat"].Value);
                }

                var faculty = await _facultyRepository.FirstOrDefaultAsync(f => f.EmailSubDomain == facultyCode && f.UniversityId == matchedUniversity.Id);
                if (faculty == null)
                {
                    throw new NotFoundException(_localizer["Auth_FacultyNotFound"].Value);
                }

                var department = await _departmentRepository.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
                if (department == null)
                    throw new NotFoundException(_localizer["Auth_DepartmentNotFound"].Value);

                if (department.FacultyId != faculty.Id)
                {
                    throw new BadRequestException(_localizer["Auth_DepartmentFacultyMismatch"].Value);
                }

                finalDepartmentId = request.DepartmentId;
            }
            else if (teacherUni != null)
            {
                assignedRole = UserRole.Teacher;
                matchedUniversity = teacherUni;

                finalDepartmentId = null;
            }
            else
            {
                throw new BadRequestException(_localizer["Auth_InvalidEmailDomain"].Value);
            }

            if (assignedRole == UserRole.Student)
            {
                if (!request.Grade.HasValue)
                    throw new BadRequestException(_localizer["Auth_StudentGradeReq"].Value);

                request.Title = null;
            }
            else if (assignedRole == UserRole.Teacher)
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                    throw new BadRequestException(_localizer["Auth_TeacherTitleReq"].Value);

                request.Grade = null;
            }

            var newUser = new User
            {
                Username = request.Username.ToLowerInvariant(),
                Email = pendingUser.Email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Title = request.Title,
                DepartmentId = finalDepartmentId,
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
            return new LoginResponse(accessToken, newUser.RefreshToken, newUser.Id, newUser.Role.ToString(), newUser.FirstName, newUser.LastName, newUser.ProfilePictureUrl);
        }

        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                throw new UnauthorizedException(_localizer["Auth_SessionExpired"].Value);

            if (!user.IsActive || user.IsDeleted)
                throw new UnauthorizedException(_localizer["Auth_Suspended"].Value);

            var newAccessToken = _tokenService.GenerateToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse(newAccessToken, newRefreshToken, user.Id, user.Role.ToString(), user.FirstName, user.LastName, user.ProfilePictureUrl);
        }

        public async Task<string> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var user = await _userRepository.GetByEmailIncludingDeletedAsync(request.Email);

            if (user != null)
            {
                var resetToken = Guid.NewGuid().ToString();
                user.PasswordResetToken = resetToken;
                user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

                await _unitOfWork.SaveChangesAsync();

                var defaultWebUrl = _configuration["WebBaseUrl"] ?? "https://univibe-three.vercel.app";
                var resetLink = $"{defaultWebUrl}/reset-password?email={user.Email}&token={resetToken}";

                string subject = _localizer["Auth_ResetEmailSubject"].Value;
                string template = _localizer["Auth_ResetEmailBody"].Value;
                string mailBody = string.Format(template, resetLink);

                try
                {
                    await _emailService.SendEmailAsync(user.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    throw new BadRequestException(_localizer["Auth_EmailSendFailed", ex.Message].Value);
                }
            }

            return _localizer["Auth_ResetLinkSent"].Value;
        }

        public async Task<string> ResetPasswordAsync(ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                throw new UnauthorizedException(_localizer["Auth_InvalidOrExpiredToken"].Value);

            var user = await _userRepository.GetByEmailIncludingDeletedAsync(request.Email);

            if (user == null || user.PasswordResetToken != request.Token || user.ResetTokenExpires < DateTime.UtcNow)
            {
                throw new UnauthorizedException(_localizer["Auth_InvalidOrExpiredToken"].Value);
            }

            if (user.IsDeleted)
            {
                if (!user.DeletedAt.HasValue || (DateTime.UtcNow - user.DeletedAt.Value).TotalDays >= 15)
                {
                    throw new BadRequestException(_localizer["Auth_DeletedTooLong"].Value);
                }

                user.IsDeleted = false;
                user.IsActive = true;
                user.DeletedAt = null;
            }

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _unitOfWork.SaveChangesAsync();

            return _localizer["Auth_PasswordResetSuccessful"].Value;
        }
        public async Task<string> GetVerificationRedirectUrlAsync(string token)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == token && !u.IsUsed);

            if (pendingUser == null || pendingUser.ExpiryDate < DateTime.UtcNow)
            {
                throw new BadRequestException(_localizer["Auth_InvalidOrExpiredToken"].Value);
            }

            string expoBaseUrl = _configuration["ExpoBaseUrl"] ?? "exp://localhost:8081";
            return $"{expoBaseUrl}/--/register-complete?token={Uri.EscapeDataString(token)}";
        }
    }
}