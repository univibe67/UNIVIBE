using System.Linq.Expressions;
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
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IPendingUserRepository> _pendingUserRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IDepartmentRepository> _departmentRepoMock;
        private readonly Mock<IFacultyRepository> _facultyRepositoryMock;
        private readonly Mock<IUniversityRepository> _universityRepositoryMock;
        private readonly Mock<IAcademicDirectoryRepository> _academicDirectoryRepositoryMock;
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
            _universityRepositoryMock = new Mock<IUniversityRepository>();
            _academicDirectoryRepositoryMock = new Mock<IAcademicDirectoryRepository>();
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

            _localizerMock.Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));

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
                _forgotPasswordValidator,
                _resetPasswordValidator,
                _httpContextAccessorMock.Object,
                _facultyRepositoryMock.Object,
                _universityRepositoryMock.Object,
                _academicDirectoryRepositoryMock.Object,
                _loggerMock.Object
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

            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<PendingUser, bool>>>(),
                    It.IsAny<bool>()))
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

        [Fact]
        public async Task CompleteRegistrationAsync_WhenStudentSubdomainWithGrade_ShouldAssignStudentRoleAndClearTitle()
        {
            var (universityId, departmentId, token) = SetupBeunRegistrationMocks(
                email: "ogrenci@mf.karaelmas.edu.tr",
                username: "ogrenci1");

            User? capturedUser = null;
            _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u => capturedUser = u)
                .Returns(Task.CompletedTask);

            var request = new RegisterCompleteRequest
            {
                Token = token,
                Username = "ogrenci1",
                Password = "Password123!",
                FirstName = "Mehmet",
                LastName = "Yılmaz",
                PhoneNumber = "05551112233",
                Title = "Prof. Dr.",
                Grade = GradeLevel.UcuncuSinif,
                DepartmentId = departmentId
            };

            var response = await _authService.CompleteRegistrationAsync(request);

            response.Role.Should().Be(UserRole.Student.ToString());
            capturedUser.Should().NotBeNull();
            capturedUser!.Role.Should().Be(UserRole.Student);
            capturedUser.Grade.Should().Be(GradeLevel.UcuncuSinif);
            capturedUser.Title.Should().BeNull();
            _universityRepositoryMock.Verify(r => r.GetAllAsync(It.IsAny<Expression<Func<University, bool>>?>(), It.IsAny<bool>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            _ = universityId;
        }

        [Fact]
        public async Task CompleteRegistrationAsync_WhenStudentSubdomainTriesPrivilegeEscalationWithNullGrade_ShouldThrowBadRequestException()
        {
            var (_, departmentId, token) = SetupBeunRegistrationMocks(
                email: "saldirgan@mf.karaelmas.edu.tr",
                username: "saldirgan1");

            var request = new RegisterCompleteRequest
            {
                Token = token,
                Username = "saldirgan1",
                Password = "Password123!",
                FirstName = "Ali",
                LastName = "Kaya",
                PhoneNumber = "05551112233",
                Title = "Prof. Dr.",
                Grade = null,
                DepartmentId = departmentId
            };

            Func<Task> act = async () => await _authService.CompleteRegistrationAsync(request);

            await act.Should().ThrowAsync<BadRequestException>();
            _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task CompleteRegistrationAsync_WhenAcademicDomainWithTitle_ShouldAssignTeacherRoleAndClearGrade()
        {
            var (_, departmentId, token) = SetupBeunRegistrationMocks(
                email: "hoca@beun.edu.tr",
                username: "hoca1");

            _academicDirectoryRepositoryMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<AcademicDirectory, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync((AcademicDirectory?)null);

            User? capturedUser = null;
            _userRepoMock.Setup(r => r.AddAsync(It.IsAny<User>()))
                .Callback<User>(u => capturedUser = u)
                .Returns(Task.CompletedTask);

            var request = new RegisterCompleteRequest
            {
                Token = token,
                Username = "hoca1",
                Password = "Password123!",
                FirstName = "Ayşe",
                LastName = "Demir",
                PhoneNumber = "05551112233",
                Title = "Dr. Öğr. Üyesi",
                Grade = GradeLevel.UcuncuSinif,
                DepartmentId = departmentId
            };

            var response = await _authService.CompleteRegistrationAsync(request);

            response.Role.Should().Be(UserRole.Teacher.ToString());
            capturedUser.Should().NotBeNull();
            capturedUser!.Role.Should().Be(UserRole.Teacher);
            capturedUser.Title.Should().Be("Dr. Öğr. Üyesi");
            capturedUser.Grade.Should().BeNull();
        }

        private (Guid UniversityId, Guid DepartmentId, string Token) SetupBeunRegistrationMocks(string email, string username)
        {
            var token = "valid-reg-token";
            var universityId = Guid.NewGuid();
            var facultyId = Guid.NewGuid();
            var departmentId = Guid.NewGuid();

            _pendingUserRepoMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<PendingUser, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new PendingUser
                {
                    Email = email,
                    Token = token,
                    IsUsed = false,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(10)
                });

            _userRepoMock.Setup(r => r.IsUsernameTakenAsync(username))
                .ReturnsAsync(false);

            _universityRepositoryMock .Setup(r => r.GetAllAsync(It.IsAny<Expression<Func<University, bool>>?>(), It.IsAny<bool>())) .ReturnsAsync(new List<University>
                {
                    new University
                    {
                        Id = universityId,
                        Name = "Zonguldak Bülent Ecevit Üniversitesi",
                        StudentEmailDomain = "karaelmas.edu.tr",
                        AcademicEmailDomain = "beun.edu.tr"
                    }
                });

            _departmentRepoMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<Department, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new Department
                {
                    Id = departmentId,
                    FacultyId = facultyId
                });

            _facultyRepositoryMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<Faculty, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new Faculty
                {
                    Id = facultyId,
                    UniversityId = universityId
                });

            _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>()))
                .Returns("hashed_password");

            _tokenServiceMock.Setup(t => t.GenerateToken(It.IsAny<User>()))
                .Returns("jwt_access_token");

            _tokenServiceMock.Setup(t => t.GenerateRefreshToken())
                .Returns("jwt_refresh_token");

            return (universityId, departmentId, token);
        }

        private void _pendingUserRepositoryMockSetupForNullToken(string token)
        {
            _pendingUserRepoMock.Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<PendingUser, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync((PendingUser?)null);
        }
        [Fact]
        public async Task InitiateRegistrationAsync_WhenUserIsSuspended_ShouldThrowBadRequestException()
        {
            var email = "askida@mf.karaelmas.edu.tr";
            var request = new RegisterInitRequest { Email = email };

            _userRepoMock
                .Setup(r => r.GetByEmailIncludingDeletedAsync(email, It.IsAny<bool>()))
                .ReturnsAsync(new User
                {
                    Email = email,
                    IsActive = false,
                    DeletedAt = null,
                    IsBannedByAdmin = false
                });

            Func<Task> act = async () => await _authService.InitiateRegistrationAsync(request);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Auth_Suspended");

            _pendingUserRepoMock.Verify(
                r => r.AddAsync(It.IsAny<PendingUser>()),
                Times.Never);
        }

        [Fact]
        public async Task InitiateRegistrationAsync_WhenUserIsBanned_ShouldThrowBadRequestException()
        {
            var email = "banli@mf.karaelmas.edu.tr";
            var request = new RegisterInitRequest { Email = email };

            _userRepoMock
                .Setup(r => r.GetByEmailIncludingDeletedAsync(email, It.IsAny<bool>()))
                .ReturnsAsync(new User
                {
                    Email = email,
                    IsActive = false,
                    IsBannedByAdmin = true
                });

            Func<Task> act = async () => await _authService.InitiateRegistrationAsync(request);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Auth_BannedByAdmin");

            _emailServiceMock.Verify(
                e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task CompleteRegistrationAsync_WhenEmailAlreadyActive_ShouldThrowConflictExceptionBeforeAddingUser()
        {
            var token = "valid-reg-token";
            var email = "aktif@mf.karaelmas.edu.tr";

            _pendingUserRepoMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<PendingUser, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new PendingUser
                {
                    Email = email,
                    Token = token,
                    IsUsed = false,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(10)
                });

            _userRepoMock
                .Setup(r => r.IsUsernameTakenAsync("yenikullanici"))
                .ReturnsAsync(false);

            _userRepoMock
                .Setup(r => r.GetByEmailIncludingDeletedAsync(email, It.IsAny<bool>()))
                .ReturnsAsync(new User
                {
                    Email = email,
                    IsActive = true,
                    IsDeleted = false
                });

            var request = new RegisterCompleteRequest
            {
                Token = token,
                Username = "yenikullanici",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "Kullanıcı",
                PhoneNumber = "05550000000",
                Grade = GradeLevel.UcuncuSinif,
                DepartmentId = Guid.NewGuid()
            };

            Func<Task> act = async () => await _authService.CompleteRegistrationAsync(request);

            await act.Should().ThrowAsync<ConflictException>()
                .WithMessage("Auth_EmailAlreadyActive");

            _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task CompleteRegistrationAsync_WhenUserIsSuspended_ShouldThrowBadRequestExceptionBeforeAddingUser()
        {
            var token = "valid-reg-token";
            var email = "askida@mf.karaelmas.edu.tr";

            _pendingUserRepoMock
                .Setup(r => r.FirstOrDefaultAsync(
                    It.IsAny<Expression<Func<PendingUser, bool>>>(),
                    It.IsAny<bool>()))
                .ReturnsAsync(new PendingUser
                {
                    Email = email,
                    Token = token,
                    IsUsed = false,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(10)
                });

            _userRepoMock
                .Setup(r => r.IsUsernameTakenAsync("askidakullanici"))
                .ReturnsAsync(false);

            _userRepoMock
                .Setup(r => r.GetByEmailIncludingDeletedAsync(email, It.IsAny<bool>()))
                .ReturnsAsync(new User
                {
                    Email = email,
                    IsActive = false,
                    DeletedAt = null,
                    IsBannedByAdmin = false
                });

            var request = new RegisterCompleteRequest
            {
                Token = token,
                Username = "askidakullanici",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "Kullanıcı",
                PhoneNumber = "05550000000",
                Grade = GradeLevel.UcuncuSinif,
                DepartmentId = Guid.NewGuid()
            };

            Func<Task> act = async () => await _authService.CompleteRegistrationAsync(request);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Auth_Suspended");

            _userRepoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
        }
    }
}