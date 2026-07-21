using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminUserService
    {
        Task<List<UserListResponse>> GetAllUsersAsync();
        Task<string> ChangeUserRoleAsync(Guid userId, UserRole newRole);
        Task<string> SuspendUserAsync(Guid userId);
        Task<string> ActivateUserAsync(Guid userId);
        Task<string> DeleteUserAsync(Guid userId);
    }
}