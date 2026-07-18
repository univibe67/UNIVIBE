using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
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
        private readonly IStringLocalizer<SharedResources> _sharedResources;

        public AdminUserController(IAdminUserService adminUserService, IStringLocalizer<SharedResources> sharedResources)
        {
            _adminUserService = adminUserService;
            _sharedResources = sharedResources;
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
            var result = await _adminUserService.SuspendUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_User_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_User_Suspended"].Value));
        }

        [HttpPut("activate/{id}")]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var result = await _adminUserService.ActivateUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_User_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_User_Activated"].Value));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var result = await _adminUserService.DeleteUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_User_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_User_Deleted"].Value));
        }

        [HttpPut("change-role/{id}")]
        public async Task<IActionResult> ChangeRole(Guid id, [FromBody] UserRole newRole)
        {
            var result = await _adminUserService.ChangeUserRoleAsync(id, newRole);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_User_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_User_RoleChanged"].Value));
        }
    }
}