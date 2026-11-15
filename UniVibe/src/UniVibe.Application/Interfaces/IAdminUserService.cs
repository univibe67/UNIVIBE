using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Interfaces
{
    public interface IAdminUserService
    {
        Task<PaginatedResult<UserListResponse>> GetAllUsersAsync(int pageNumber, int pageSize);
        Task<string> ChangeUserRoleAsync(Guid userId, UserRole newRole, Guid currentAdminId);
        Task<string> SuspendUserAsync(Guid userId, Guid currentAdminId);
        Task<string> ActivateUserAsync(Guid userId);
        Task<string> DeleteUserAsync(Guid userId, Guid currentAdminId);
    }
}