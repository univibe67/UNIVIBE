using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/admin/users")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminUserController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUserController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _adminUserService.GetAllUsersAsync();
            return Ok(ApiResponse<List<UserListResponse>>.Success(users));
        }

        [HttpPatch("{id}/suspension")]
        public async Task<IActionResult> SuspendUser(Guid id)
        {
            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.SuspendUserAsync(id, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id}/activation")]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var message = await _adminUserService.ActivateUserAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.DeleteUserAsync(id, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id}/role")]
        public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest request)
        {
            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.ChangeUserRoleAsync(id, request.NewRole, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}