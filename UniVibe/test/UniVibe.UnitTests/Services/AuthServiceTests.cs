using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Application.Validators.Auth;
using UniVibe.Domain.Entities;

namespace UniVibe.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IPendingUserRepository> _pendingUserRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IDepartmentRepository> _departmentRepoMock;
        private readonly Mock<IFacultyRepository> _facultyRepositoryMock;
        private readonly Mock<IUniversityRepository> _universityRepositoryMock; // 📌 1. Mock alanı eklendi
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IPasswordHasher> _passwordHasherMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;

        private readonly IValidator<RegisterInitRequest> _registerInitValidator;
        private readonly IValidator<RegisterCompleteRequest> _registerCompleteValidator;
        private readonly IValidator<ForgotPasswordRequest> _forgotPasswordValidator;
        private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;

        private readonly AuthService _authService;
        private readonly Mock<ILogger<AuthService>> _loggerMock;

        public AuthServiceTests()
        {
            _pendingUserRepoMock = new Mock<IPendingUserRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _departmentRepoMock = new Mock<IDepartmentRepository>();
            _facultyRepositoryMock = new Mock<IFacultyRepository>();
            _universityRepositoryMock = new Mock<IUniversityRepository>(); // 📌 2. Mock initialize edildi
            _emailServiceMock = new Mock<IEmailService>();
            _passwordHasherMock = new Mock<IPasswordHasher>();
            _tokenServiceMock = new Mock<ITokenService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();
            _configurationMock = new Mock<IConfiguration>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _loggerMock = new Mock<ILogger<AuthService>>();
            _registerInitValidator = new InlineValidator<RegisterInitRequest>();
            _registerCompleteValidator = new InlineValidator<RegisterCompleteRequest>();
            _forgotPasswordValidator = new InlineValidator<ForgotPasswordRequest>();
            _resetPasswordValidator = new InlineValidator<ResetPasswordRequest>();

            _authService = new AuthService(
                _pendingUserRepoMock.Object,        // 1. IPendingUserRepository
                _emailServiceMock.Object,           // 2. IEmailService
                _userRepoMock.Object,               // 3. IUserRepository
                _passwordHasherMock.Object,         // 4. IPasswordHasher
                _tokenServiceMock.Object,           // 5. ITokenService
                _departmentRepoMock.Object,         // 6. IDepartmentRepository
                _unitOfWorkMock.Object,             // 7. IUnitOfWork
                _localizerMock.Object,              // 8. IStringLocalizer<SharedResources>
                _configurationMock.Object,          // 9. IConfiguration
                _registerInitValidator,          // 10. IValidator<RegisterInitRequest>
                _registerCompleteValidator,         // 11. IValidator<RegisterCompleteRequest>
                _forgotPasswordValidator,           // 12. IValidator<ForgotPasswordRequest>
                _resetPasswordValidator,            // 13. IValidator<ResetPasswordRequest>
                _httpContextAccessorMock.Object,    // 14. IHttpContextAccessor
                _facultyRepositoryMock.Object,      // 15. IFacultyRepository
                _universityRepositoryMock.Object,
                _loggerMock.Object                  // 14. ILogger<AuthService> (YENİ)
            );
        }

        [Fact]
        public async Task LoginAsync_WhenUserNotFound_ShouldThrowUnauthorizedException()
        {
            var request = new LoginRequest("test@univibe.com", "Password123");

            _userRepoMock.Setup(r => r.GetByEmailIncludingDeletedAsync(request.Email, It.IsAny<bool>()))
                .ReturnsAsync((User?)null);

            _localizerMock.Setup(l => l["Auth_InvalidCredentials"])
                .Returns(new LocalizedString("Auth_InvalidCredentials", "Geçersiz kimlik bilgileri."));

            Func<Task> act = async () => await _authService.LoginAsync(request);

            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Geçersiz kimlik bilgileri.");
        }

        [Fact]
        public async Task LoginAsync_WhenPasswordIsInvalid_ShouldThrowUnauthorizedException()
        {
            var request = new LoginRequest("test@univibe.com", "Password123");
            var user = new User { Email = request.Email, PasswordHash = "hashed_pass", IsActive = true };

            _userRepoMock.Setup(r => r.GetByEmailIncludingDeletedAsync(request.Email, It.IsAny<bool>()))
                .ReturnsAsync(user);

            _passwordHasherMock.Setup(p => p.Verify(request.Password, user.PasswordHash))
                .Returns(false);

            _localizerMock.Setup(l => l["Auth_InvalidCredentials"])
                .Returns(new LocalizedString("Auth_InvalidCredentials", "Geçersiz kimlik bilgileri."));

            Func<Task> act = async () => await _authService.LoginAsync(request);

            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Geçersiz kimlik bilgileri.");
        }

        [Fact]
        public async Task VerifyTokenAsync_WhenTokenInvalidOrExpired_ShouldReturnFalse()
        {
            var token = "invalid-token";

            _pendingUserRepositoryMockSetupForNullToken(token);

            var result = await _authService.VerifyTokenAsync(token);

            result.Should().BeFalse();
        }

        [Fact]
        public async Task VerifyTokenAsync_WhenTokenValid_ShouldReturnTrue()
        {
            var token = "valid-token";
            var pendingUser = new PendingUser
            {
                Token = token,
                IsUsed = false,
                ExpiryDate = DateTime.UtcNow.AddMinutes(10)
            };

            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PendingUser, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(pendingUser);

            var result = await _authService.VerifyTokenAsync(token);

            result.Should().BeTrue();
        }

        [Fact]
        public async Task ResetPasswordAsync_WhenTokenIsEmpty_ShouldThrowUnauthorizedException()
        {
            var request = new ResetPasswordRequest { Token = "", Email = "test@univibe.com", NewPassword = "NewPassword123" };

            _localizerMock.Setup(l => l["Auth_InvalidOrExpiredToken"])
                .Returns(new LocalizedString("Auth_InvalidOrExpiredToken", "Geçersiz veya süresi dolmuş token."));

            Func<Task> act = async () => await _authService.ResetPasswordAsync(request);

            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Geçersiz veya süresi dolmuş token.");
        }

        private void _pendingUserRepositoryMockSetupForNullToken(string token)
        {
            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PendingUser, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync((PendingUser?)null);
        }
    }
}