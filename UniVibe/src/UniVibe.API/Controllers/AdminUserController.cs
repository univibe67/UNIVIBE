using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Exceptions;
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
        public async Task<IActionResult> GetAllUsers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var pagedUsers = await _adminUserService.GetAllUsersAsync(pageNumber, pageSize);
            return Ok(ApiResponse<PaginatedResult<UserListResponse>>.Success(pagedUsers));
        }

        [HttpPatch("{id:guid}/suspension")]
        public async Task<IActionResult> SuspendUser(Guid id)
        {
            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.SuspendUserAsync(id, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id:guid}/activation")]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var message = await _adminUserService.ActivateUserAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.DeleteUserAsync(id, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id:guid}/role")]
        public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest? request)
        {
            if (request is null)
                throw new BadRequestException("Rol değiştirme isteği gövdesi boş olamaz.");

            var currentAdminId = User.GetUserId();
            var message = await _adminUserService.ChangeUserRoleAsync(id, request.NewRole, currentAdminId);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}