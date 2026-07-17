using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminUserService
    {
        Task<List<UserListResponse>> GetAllUsersAsync();
        Task<bool> ChangeUserRoleAsync(Guid userId, UserRole newRole);
        Task<bool> SuspendUserAsync(Guid userId);
        Task<bool> ActivateUserAsync(Guid userId);
        Task<bool> DeleteUserAsync(Guid userId);
    }
}
