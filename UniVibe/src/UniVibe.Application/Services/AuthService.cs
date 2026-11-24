using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
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
        private readonly IAcademicDirectoryRepository _academicDirectoryRepository;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IConfiguration _configuration;
        private readonly IValidator<RegisterInitRequest> _registerInitValidator;
        private readonly IValidator<RegisterCompleteRequest> _registerCompleteValidator;
        private readonly IValidator<ForgotPasswordRequest> _forgotPasswordValidator;
        private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<AuthService> _logger;

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
            IValidator<ForgotPasswordRequest> forgotPasswordValidator,
            IValidator<ResetPasswordRequest> resetPasswordValidator,
            IHttpContextAccessor httpContextAccessor,
            IFacultyRepository facultyRepository,
            IUniversityRepository universityRepository,
            IAcademicDirectoryRepository academicDirectoryRepository,
            ILogger<AuthService> logger)
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
            _forgotPasswordValidator = forgotPasswordValidator;
            _resetPasswordValidator = resetPasswordValidator;
            _httpContextAccessor = httpContextAccessor;
            _facultyRepository = facultyRepository;
            _universityRepository = universityRepository;
            _academicDirectoryRepository = academicDirectoryRepository;
            _logger = logger;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var user = await _userRepository.FirstOrDefaultAsync(
                u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted,
                trackChanges: true);

            user ??= await _userRepository.GetByEmailIncludingDeletedAsync(normalizedEmail, trackChanges: true);

            if (user == null)
                throw new UnauthorizedException(_localizer["Auth_InvalidCredentials"].Value);

            var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new UnauthorizedException(_localizer["Auth_InvalidCredentials"].Value);

            if (!user.IsActive)
            {
                if (user.IsBannedByAdmin)
                {
                    throw new BadRequestException(_localizer["Auth_BannedByAdmin"].Value);
                }

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

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var existingUser = await _userRepository.GetByEmailIncludingDeletedAsync(normalizedEmail, trackChanges: true);

            if (existingUser != null)
            {
                if (existingUser.IsBannedByAdmin)
                {
                    throw new BadRequestException(_localizer["Auth_BannedByAdmin"].Value);
                }

                if (existingUser.IsActive)
                {
                    throw new ConflictException(_localizer["Auth_EmailAlreadyActive"].Value);
                }

                if (existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = Math.Max(1, (int)Math.Ceiling(15 - gecenSure));
                        throw new BadRequestException(_localizer["Auth_InDeletionProcess", kalanGun].Value);
                    }
                    else
                    {
                        var suffix = Guid.NewGuid().ToString("N");
                        existingUser.Email = $"deleted_{suffix}@univibe.local";
                        existingUser.Username = $"del_{suffix}";
                        existingUser.FirstName = "Silinmiş";
                        existingUser.LastName = "Kullanıcı";
                        existingUser.Bio = null;
                        existingUser.SocialMediaLink = null;
                        existingUser.ProfilePictureUrl = null;
                        existingUser.IsActive = false;
                        existingUser.IsDeleted = true;
                    }
                }
                else
                {
                    throw new BadRequestException(_localizer["Auth_Suspended"].Value);
                }
            }

            var existingPending = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
            if (existingPending != null)
            {
                _pendingUserRepository.Delete(existingPending);
            }

            var token = Guid.NewGuid().ToString();
            var pendingUser = new PendingUser
            {
                Email = normalizedEmail,
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

                if (targetUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
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

                await _emailService.SendEmailAsync(normalizedEmail, subject, mailBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıt doğrulama e-postası gönderilemedi. E-posta: {Email}, Hata: {ErrorMessage}", normalizedEmail, ex.Message);

                _pendingUserRepository.Delete(pendingUser);
                await _unitOfWork.SaveChangesAsync();

                throw new BadRequestException(_localizer["Auth_EmailSendFailedGeneric"].Value);
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

            var normalizedUsername = request.Username.Trim().ToLowerInvariant();
            var isUsernameTaken = await _userRepository.IsUsernameTakenAsync(normalizedUsername);
            if (isUsernameTaken)
                throw new ConflictException(_localizer["Auth_UsernameTaken"].Value);

            var normalizedEmail = pendingUser.Email.Trim().ToLowerInvariant();

            var existingUser = await _userRepository.GetByEmailIncludingDeletedAsync(normalizedEmail, trackChanges: true);
            if (existingUser != null)
            {
                if (existingUser.IsBannedByAdmin)
                {
                    throw new BadRequestException(_localizer["Auth_BannedByAdmin"].Value);
                }

                if (existingUser.IsActive)
                {
                    throw new ConflictException(_localizer["Auth_EmailAlreadyActive"].Value);
                }

                if (existingUser.DeletedAt.HasValue)
                {
                    var gecenSure = (DateTime.UtcNow - existingUser.DeletedAt.Value).TotalDays;

                    if (gecenSure < 15)
                    {
                        int kalanGun = Math.Max(1, (int)Math.Ceiling(15 - gecenSure));
                        throw new BadRequestException(_localizer["Auth_InDeletionProcess", kalanGun].Value);
                    }
                    else
                    {
                        var suffix = Guid.NewGuid().ToString("N");
                        existingUser.Email = $"deleted_{suffix}@univibe.local";
                        existingUser.Username = $"del_{suffix}";
                        existingUser.FirstName = "Silinmiş";
                        existingUser.LastName = "Kullanıcı";
                        existingUser.Bio = null;
                        existingUser.SocialMediaLink = null;
                        existingUser.ProfilePictureUrl = null;
                        existingUser.IsActive = false;
                        existingUser.IsDeleted = true;
                    }
                }
                else
                {
                    throw new BadRequestException(_localizer["Auth_Suspended"].Value);
                }
            }

            var emailParts = normalizedEmail.Split('@');
            if (emailParts.Length != 2)
                throw new BadRequestException(_localizer["Auth_InvalidEmailFormat"].Value);

            var emailDomain = emailParts[1];
            var universities = await _universityRepository.GetAllAsync();

            var studentUni = universities.FirstOrDefault(u =>
                MatchesDomain(emailDomain, u.StudentEmailDomain, allowSubdomains: true));

            var teacherUni = studentUni == null
                ? universities.FirstOrDefault(u => MatchesDomain(emailDomain, u.AcademicEmailDomain, allowSubdomains: false))
                : null;

            var matchedUniversity = studentUni ?? teacherUni;
            if (matchedUniversity == null)
                throw new BadRequestException(_localizer["Auth_InvalidEmailDomain"].Value);

            var department = await _departmentRepository.FirstOrDefaultAsync(d => d.Id == request.DepartmentId);
            if (department == null)
                throw new NotFoundException(_localizer["Auth_DepartmentNotFound"].Value);

            var faculty = await _facultyRepository.FirstOrDefaultAsync(f => f.Id == department.FacultyId);
            if (faculty == null || faculty.UniversityId != matchedUniversity.Id)
                throw new BadRequestException(_localizer["Auth_DepartmentUniversityMismatch"].Value);

            bool isStudentEmail = studentUni != null;

            UserRole assignedRole;
            string firstName = request.FirstName;
            string lastName = request.LastName;
            string? title = request.Title;

            if (isStudentEmail)
            {
                if (!request.Grade.HasValue)
                    throw new BadRequestException(_localizer["Auth_TeacherTitleReq"].Value);

                title = null;
                assignedRole = UserRole.Student;
            }
            else
            {
                var academicRecord = await _academicDirectoryRepository.FirstOrDefaultAsync(
                    a => a.Email == normalizedEmail && a.UniversityId == matchedUniversity.Id && !a.IsDeleted);

                if (academicRecord != null)
                {
                    title = string.IsNullOrWhiteSpace(title) ? academicRecord.Title : title;
                    firstName = string.IsNullOrWhiteSpace(firstName) ? academicRecord.FirstName : firstName;
                    lastName = string.IsNullOrWhiteSpace(lastName) ? academicRecord.LastName : lastName;
                }

                if (string.IsNullOrWhiteSpace(title))
                    throw new BadRequestException(_localizer["Auth_TeacherTitleReq"].Value);

                assignedRole = UserRole.Teacher;
            }

            var newUser = new User
            {
                Username = normalizedUsername,
                Email = normalizedEmail,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = firstName,
                LastName = lastName,
                PhoneNumber = request.PhoneNumber,
                Title = title,
                Grade = assignedRole == UserRole.Student ? request.Grade : null,
                DateOfBirth = request.DateOfBirth,
                Gender = request.Gender,
                DepartmentId = request.DepartmentId,
                Role = assignedRole,
                IsActive = true,
                ProfilePictureUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString($"{firstName} {lastName}")}&background=random&color=fff",
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
            var user = await _userRepository.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, trackChanges: true);

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
            await _forgotPasswordValidator.ValidateAndThrowCustomAsync(request);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var user = await _userRepository.FirstOrDefaultAsync(
                u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted,
                trackChanges: true);

            user ??= await _userRepository.GetByEmailIncludingDeletedAsync(normalizedEmail, trackChanges: true);

            if (user != null)
            {
                var resetToken = Guid.NewGuid().ToString();
                user.PasswordResetToken = resetToken;
                user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

                await _unitOfWork.SaveChangesAsync();

                var defaultWebUrl = _configuration["WebBaseUrl"] ?? "https://univibe-three.vercel.app";
                var resetLink = $"{defaultWebUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(resetToken)}";

                string subject = _localizer["Auth_ResetEmailSubject"].Value;
                string template = _localizer["Auth_ResetEmailBody"].Value;
                string mailBody = string.Format(template, resetLink);

                try
                {
                    await _emailService.SendEmailAsync(user.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Şifre sıfırlama e-postası gönderilemedi. E-posta: {Email}, Hata: {ErrorMessage}", user.Email, ex.Message);
                    throw new BadRequestException(_localizer["Auth_EmailSendFailedGeneric"].Value);
                }
            }

            return _localizer["Auth_ResetLinkSent"].Value;
        }

        public async Task<string> ResetPasswordAsync(ResetPasswordRequest request)
        {
            await _resetPasswordValidator.ValidateAndThrowCustomAsync(request);

            if (string.IsNullOrWhiteSpace(request.Token))
                throw new UnauthorizedException(_localizer["Auth_InvalidOrExpiredToken"].Value);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var user = await _userRepository.FirstOrDefaultAsync(
                u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted,
                trackChanges: true);

            user ??= await _userRepository.GetByEmailIncludingDeletedAsync(normalizedEmail, trackChanges: true);

            if (user == null || user.PasswordResetToken != request.Token || user.ResetTokenExpires < DateTime.UtcNow)
            {
                throw new UnauthorizedException(_localizer["Auth_InvalidOrExpiredToken"].Value);
            }

            if (user.IsBannedByAdmin)
            {
                throw new BadRequestException(_localizer["Auth_BannedByAdmin"].Value);
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

        public async Task<RegistrationDetailsResponse> GetRegistrationDetailsByTokenAsync(string token)
        {
            var pendingUser = await _pendingUserRepository.FirstOrDefaultAsync(u => u.Token == token && !u.IsUsed);
            if (pendingUser == null || pendingUser.ExpiryDate < DateTime.UtcNow)
            {
                throw new BadRequestException(_localizer["Auth_InvalidOrExpiredToken"].Value);
            }

            var email = pendingUser.Email.Trim().ToLowerInvariant();
            var parts = email.Split('@');
            if (parts.Length != 2)
                throw new BadRequestException(_localizer["Auth_InvalidEmailFormat"].Value);

            var emailDomain = parts[1];
            var universities = await _universityRepository.GetAllAsync();

            var studentUni = universities.FirstOrDefault(u =>
                MatchesDomain(emailDomain, u.StudentEmailDomain, allowSubdomains: true));

            var teacherUni = studentUni == null
                ? universities.FirstOrDefault(u => MatchesDomain(emailDomain, u.AcademicEmailDomain, allowSubdomains: false))
                : null;

            University? matchedUniversity = studentUni ?? teacherUni;
            if (matchedUniversity == null)
            {
                throw new BadRequestException(_localizer["Auth_InvalidEmailDomain"].Value);
            }

            string facultyName = string.Empty;
            Guid facultyId = Guid.Empty;
            bool isAcademicEmail = false;
            string? title = null;
            string? firstName = null;
            string? lastName = null;

            if (studentUni != null)
            {
                var domainParts = emailDomain.Split('.');
                string facultyCode = domainParts.Length >= 3 ? domainParts[0] : string.Empty;

                if (!string.IsNullOrEmpty(facultyCode))
                {
                    var faculty = await _facultyRepository.FirstOrDefaultAsync(f => f.EmailSubDomain == facultyCode && f.UniversityId == matchedUniversity.Id);
                    if (faculty != null)
                    {
                        facultyId = faculty.Id;
                        facultyName = faculty.Name;
                    }
                }
            }
            else if (teacherUni != null)
            {
                isAcademicEmail = true;

                var academicRecord = await _academicDirectoryRepository.FirstOrDefaultAsync(
                    a => a.Email == email && a.UniversityId == matchedUniversity.Id && !a.IsDeleted);

                if (academicRecord != null)
                {
                    title = string.IsNullOrWhiteSpace(title) ? academicRecord.Title : title;
                    firstName = string.IsNullOrWhiteSpace(firstName) ? academicRecord.FirstName : firstName;
                    lastName = string.IsNullOrWhiteSpace(lastName) ? academicRecord.LastName : lastName;
                }
            }

            return new RegistrationDetailsResponse(
                matchedUniversity.Id,
                matchedUniversity.Name,
                facultyId,
                facultyName,
                isAcademicEmail,
                title,
                firstName,
                lastName
            );
        }
        private static bool MatchesDomain(string emailDomain, string? configuredDomain, bool allowSubdomains)
        {
            if (string.IsNullOrWhiteSpace(configuredDomain))
                return false;

            var clean = configuredDomain.Trim().TrimStart('@').ToLowerInvariant();
            if (emailDomain.Equals(clean, StringComparison.OrdinalIgnoreCase))
                return true;

            return allowSubdomains && emailDomain.EndsWith($".{clean}", StringComparison.OrdinalIgnoreCase);
        }
    }
}