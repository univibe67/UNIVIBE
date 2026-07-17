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
            var result = await _adminUserService.SuspendUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail("Askıya alınacak kullanıcı bulunamadı."));

            return Ok(ApiResponse<string>.Success("Kullanıcı başarıyla askıya alındı."));
        }

        [HttpPut("activate/{id}")]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var result = await _adminUserService.ActivateUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail("Aktif edilecek kullanıcı bulunamadı."));

            return Ok(ApiResponse<string>.Success("Kullanıcının hesabı tekrar aktif edildi."));
        }

        [HttpDelete("delete/{id}")] 
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var result = await _adminUserService.DeleteUserAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail("Silinecek kullanıcı bulunamadı."));

            return Ok(ApiResponse<string>.Success("Kullanıcı sistemden kalıcı olarak (Soft Delete) silindi."));
        }

        [HttpPut("change-role/{id}")]
        public async Task<IActionResult> ChangeRole(Guid id, [FromBody] UserRole newRole)
        {
            var result = await _adminUserService.ChangeUserRoleAsync(id, newRole);

            if (!result)
                return NotFound(ApiResponse<string>.Fail("Kullanıcı bulunamadı."));

            return Ok(ApiResponse<string>.Success("Kullanıcının rolü başarıyla değiştirildi."));
        }
    }
}