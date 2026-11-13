using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;

namespace UniVibe.UnitTests.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IEventRepository> _eventRepoMock;
        private readonly Mock<IImageService> _imageServiceMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;
        private readonly Mock<IValidator<UpdateUserProfileRequest>> _updateProfileValidatorMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IPasswordHasher> _passwordHasherMock;
        private readonly Mock<ILogger<UserService>> _loggerMock;

        private readonly UserService _userService;

        public UserServiceTests()
        {
            // 1. UserService'in constructor'ındaki 10 bağımlılığın tamamını Moq ile taklit ediyoruz
            _userRepoMock = new Mock<IUserRepository>();
            _eventRepoMock = new Mock<IEventRepository>();
            _imageServiceMock = new Mock<IImageService>();
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();
            _updateProfileValidatorMock = new Mock<IValidator<UpdateUserProfileRequest>>();
            _emailServiceMock = new Mock<IEmailService>();
            _passwordHasherMock = new Mock<IPasswordHasher>();
            _loggerMock = new Mock<ILogger<UserService>>();

            // 2. Servisimizi bu sahte bağımlılıklarla ayağa kaldırıyoruz
            _userService = new UserService(
                _userRepoMock.Object,
                _imageServiceMock.Object,
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _updateProfileValidatorMock.Object,
                _emailServiceMock.Object,
                _passwordHasherMock.Object,
                _eventRepoMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task GetUserProfileAsync_WhenUserExists_ShouldReturnUserProfileResponse()
        {
            // --- ARRANGE (Hazırlık) ---
            var userId = Guid.NewGuid();
            var mockUser = new User { Id = userId, FirstName = "Mertcan", Email = "mertcan@test.com" };
            var expectedResponse = new UserProfileResponse { FirstName = "Mertcan" };

            // Repository çağrıldığında bu kullanıcıyı dönsün
            _userRepoMock.Setup(r => r.GetUserWithDetailsByIdAsync(userId))
                .ReturnsAsync(mockUser);

            // AutoMapper çağrıldığında DTO dönsün
            _mapperMock.Setup(m => m.Map<UserProfileResponse>(mockUser))
                .Returns(expectedResponse);

            // --- ACT (Çalıştırma) ---
            var result = await _userService.GetUserProfileAsync(userId);

            // --- ASSERT (Doğrulama) ---
            result.Should().NotBeNull();
            result.FirstName.Should().Be("Mertcan");
        }

        [Fact]
        public async Task GetUserProfileAsync_WhenUserDoesNotExist_ShouldThrowNotFoundException()
        {
            // --- ARRANGE (Hazırlık) ---
            var userId = Guid.NewGuid();

            // Kullanıcı veritabanında yok (null dönüyor)
            _userRepoMock.Setup(r => r.GetUserWithDetailsByIdAsync(userId))
                .ReturnsAsync((User?)null);

            // Yerelleştirme (Localization) mesajı ayarlanıyor
            _localizerMock.Setup(l => l["User_NotFound"])
                .Returns(new LocalizedString("User_NotFound", "Kullanıcı bulunamadı."));

            // --- ACT & ASSERT (Çalıştırma ve Hata Doğrulama) ---
            Func<Task> act = async () => await _userService.GetUserProfileAsync(userId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Kullanıcı bulunamadı.");
        }
    }
}