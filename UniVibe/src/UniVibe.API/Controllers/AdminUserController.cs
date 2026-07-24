using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Domain.Enums;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminUserController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUserController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _adminUserService.GetAllUsersAsync();
            return Ok(ApiResponse<List<UserListResponse>>.Success(users));
        }

        [HttpPut("suspend/{id}")]
        public async Task<IActionResult> SuspendUser(Guid id)
        {
            var message = await _adminUserService.SuspendUserAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPut("activate/{id}")]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var message = await _adminUserService.ActivateUserAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var message = await _adminUserService.DeleteUserAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPut("change-role/{id}")]
        public async Task<IActionResult> ChangeRole(Guid id, [FromBody] UserRole newRole)
        {
            var message = await _adminUserService.ChangeUserRoleAsync(id, newRole);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}