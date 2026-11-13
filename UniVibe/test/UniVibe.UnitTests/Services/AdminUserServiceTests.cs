using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class AdminUserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IEventRepository> _eventRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;

        private readonly AdminUserService _adminUserService;

        public AdminUserServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _eventRepoMock = new Mock<IEventRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();

            _adminUserService = new AdminUserService(
                _userRepoMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _localizerMock.Object,
                _eventRepoMock.Object
            );
        }

        // ==========================================
        // 1. TESTS FOR GetAllUsersAsync
        // ==========================================
        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnListOfUserListResponses()
        {
            // Arrange
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), FirstName = "Mertcan", Email = "mertcan@test.com" }
            };
            var expectedResponse = new List<UserListResponse>
            {
                new UserListResponse { FirstName = "Mertcan", Email = "mertcan@test.com" }
            };

            _userRepoMock.Setup(r => r.GetAllIncludingDeletedAsync())
                .ReturnsAsync(users);

            _mapperMock.Setup(m => m.Map<List<UserListResponse>>(users))
                .Returns(expectedResponse);

            // Act
            var result = await _adminUserService.GetAllUsersAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].FirstName.Should().Be("Mertcan");
        }

        // ==========================================
        // 2. TESTS FOR ChangeUserRoleAsync
        // ==========================================
        [Fact]
        public async Task ChangeUserRoleAsync_WhenAdminTriesToChangeOwnRole_ShouldThrowBadRequestException()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var newRole = UserRole.Admin;

            // Act & Assert
            Func<Task> act = async () => await _adminUserService.ChangeUserRoleAsync(adminId, newRole, adminId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Kendi rolünüzü değiştiremezsiniz.");
        }

        [Fact]
        public async Task ChangeUserRoleAsync_WhenUserNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var targetUserId = Guid.NewGuid();
            var newRole = UserRole.Teacher;

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(targetUserId))
                .ReturnsAsync((User?)null);

            _localizerMock.Setup(l => l["Res_User_NotFound"])
                .Returns(new LocalizedString("Res_User_NotFound", "Kullanıcı bulunamadı."));

            // Act & Assert
            Func<Task> act = async () => await _adminUserService.ChangeUserRoleAsync(targetUserId, newRole, adminId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Kullanıcı bulunamadı.");
        }

        [Fact]
        public async Task ChangeUserRoleAsync_WhenValid_ShouldChangeRoleSuccessfully()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var targetUserId = Guid.NewGuid();
            var user = new User { Id = targetUserId, Role = UserRole.Student };

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(targetUserId))
                .ReturnsAsync(user);

            _localizerMock.Setup(l => l["Res_User_RoleChanged"])
                .Returns(new LocalizedString("Res_User_RoleChanged", "Kullanıcı rolü başarıyla değiştirildi."));

            // Act
            var result = await _adminUserService.ChangeUserRoleAsync(targetUserId, UserRole.Teacher, adminId);

            // Assert
            result.Should().Be("Kullanıcı rolü başarıyla değiştirildi.");
            user.Role.Should().Be(UserRole.Teacher);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }

        // ==========================================
        // 3. TESTS FOR SuspendUserAsync
        // ==========================================
        [Fact]
        public async Task SuspendUserAsync_WhenAdminTriesToSuspendSelf_ShouldThrowBadRequestException()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            // Act & Assert
            Func<Task> act = async () => await _adminUserService.SuspendUserAsync(adminId, adminId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Kendi hesabınızı askıya alamazsınız.");
        }

        [Fact]
        public async Task SuspendUserAsync_WhenUserValid_ShouldSuspendSuccessfully()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var targetUserId = Guid.NewGuid();
            var user = new User { Id = targetUserId, IsActive = true, IsDeleted = false };

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(targetUserId))
                .ReturnsAsync(user);

            _localizerMock.Setup(l => l["Res_User_Suspended"])
                .Returns(new LocalizedString("Res_User_Suspended", "Kullanıcı hesabı askıya alındı."));

            // Act
            var result = await _adminUserService.SuspendUserAsync(targetUserId, adminId);

            // Assert
            result.Should().Be("Kullanıcı hesabı askıya alındı.");
            user.IsActive.Should().BeFalse();
            user.RefreshToken.Should().BeNull();
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }

        // ==========================================
        // 4. TESTS FOR ActivateUserAsync
        // ==========================================
        [Fact]
        public async Task ActivateUserAsync_WhenUserExists_ShouldActivateSuccessfully()
        {
            // Arrange
            var targetUserId = Guid.NewGuid();
            var user = new User { Id = targetUserId, IsActive = false, IsDeleted = true, DeletedAt = DateTime.UtcNow };

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(targetUserId))
                .ReturnsAsync(user);

            _localizerMock.Setup(l => l["Res_User_Activated"])
                .Returns(new LocalizedString("Res_User_Activated", "Kullanıcı hesabı aktifleştirildi."));

            // Act
            var result = await _adminUserService.ActivateUserAsync(targetUserId);

            // Assert
            result.Should().Be("Kullanıcı hesabı aktifleştirildi.");
            user.IsActive.Should().BeTrue();
            user.IsDeleted.Should().BeFalse();
            user.DeletedAt.Should().BeNull();
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }

        // ==========================================
        // 5. TESTS FOR DeleteUserAsync
        // ==========================================
        [Fact]
        public async Task DeleteUserAsync_WhenAdminTriesToDeleteSelf_ShouldThrowBadRequestException()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            // Act & Assert
            Func<Task> act = async () => await _adminUserService.DeleteUserAsync(adminId, adminId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Kendi hesabınızı silemezsiniz.");
        }

        [Fact]
        public async Task DeleteUserAsync_WhenUserExists_ShouldMarkAsDeletedAndCancelEvents()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var targetUserId = Guid.NewGuid();
            var user = new User { Id = targetUserId, IsActive = true, IsDeleted = false };

            var activeEvents = new List<Event>
            {
                new Event { Id = Guid.NewGuid(), UserId = targetUserId, Status = EventStatus.Approved, EventDate = DateTime.UtcNow.AddDays(1) }
            };

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(targetUserId))
                .ReturnsAsync(user);

            _eventRepoMock.Setup(r => r.GetAllAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(activeEvents);

            _localizerMock.Setup(l => l["Res_User_Deleted"])
                .Returns(new LocalizedString("Res_User_Deleted", "Kullanıcı silindi."));

            // Act
            var result = await _adminUserService.DeleteUserAsync(targetUserId, adminId);

            // Assert
            result.Should().Be("Kullanıcı silindi.");
            user.IsDeleted.Should().BeTrue();
            user.IsActive.Should().BeFalse();
            activeEvents[0].Status.Should().Be(EventStatus.Cancelled);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }
    }
}