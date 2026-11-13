using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;

namespace UniVibe.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IPendingUserRepository> _pendingUserRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IDepartmentRepository> _departmentRepoMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IPasswordHasher> _passwordHasherMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;

        // Validator'lar için InlineValidator kullanarak NullReferenceException'ı engelliyoruz
        private readonly IValidator<RegisterInitRequest> _registerInitValidator;
        private readonly IValidator<RegisterCompleteRequest> _registerCompleteValidator;

        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _pendingUserRepoMock = new Mock<IPendingUserRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _departmentRepoMock = new Mock<IDepartmentRepository>();
            _emailServiceMock = new Mock<IEmailService>();
            _passwordHasherMock = new Mock<IPasswordHasher>();
            _tokenServiceMock = new Mock<ITokenService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();
            _configurationMock = new Mock<IConfiguration>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _registerInitValidator = new InlineValidator<RegisterInitRequest>();
            _registerCompleteValidator = new InlineValidator<RegisterCompleteRequest>();

            _authService = new AuthService(
                _pendingUserRepoMock.Object,
                _emailServiceMock.Object,
                _userRepoMock.Object,
                _passwordHasherMock.Object,
                _tokenServiceMock.Object,
                _departmentRepoMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _configurationMock.Object,
                _registerInitValidator,
                _registerCompleteValidator,
                _httpContextAccessorMock.Object
            );
        }

        // ==========================================
        // 1. TESTS FOR LoginAsync
        // ==========================================
        [Fact]
        public async Task LoginAsync_WhenUserNotFound_ShouldThrowUnauthorizedException()
        {
            var request = new LoginRequest("test@univibe.com", "Password123");

            _userRepoMock.Setup(r => r.GetByEmailIncludingDeletedAsync(request.Email))
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

            _userRepoMock.Setup(r => r.GetByEmailIncludingDeletedAsync(request.Email))
                .ReturnsAsync(user);

            _passwordHasherMock.Setup(p => p.Verify(request.Password, user.PasswordHash))
                .Returns(false); // Şifre yanlış

            _localizerMock.Setup(l => l["Auth_InvalidCredentials"])
                .Returns(new LocalizedString("Auth_InvalidCredentials", "Geçersiz kimlik bilgileri."));

            Func<Task> act = async () => await _authService.LoginAsync(request);

            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Geçersiz kimlik bilgileri.");
        }

        // ==========================================
        // 2. TESTS FOR VerifyTokenAsync
        // ==========================================
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
                ExpiryDate = DateTime.UtcNow.AddMinutes(10) // Süresi geçmemiş
            };

            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PendingUser, bool>>>()))
                .ReturnsAsync(pendingUser);

            var result = await _authService.VerifyTokenAsync(token);

            result.Should().BeTrue();
        }

        // ==========================================
        // 3. TESTS FOR ResetPasswordAsync
        // ==========================================
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

        // --- Helper setup for PendingUser null checks ---
        private void _pendingUserRepositoryMockSetupForNullToken(string token)
        {
            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<PendingUser, bool>>>()))
                .ReturnsAsync((PendingUser?)null);
        }
    }
}