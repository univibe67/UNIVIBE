using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Constants;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture( IFormFile profileImage)
        {

            var userId = User.GetUserId();
            var newImageUrl = await _userService.UploadProfilePictureAsync(userId, profileImage);

            return Ok(new { Message = "Profil fotoğrafı güncellendi!", ImageUrl = newImageUrl });
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto updateDto)
        {
            var userId = User.GetUserId();

            await _userService.UpdateProfileAsync(userId, updateDto);

            return Ok(new { Message = "Profil bilgileri başarıyla güncellendi!" });
        }
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.GetUserId();

            var profileData = await _userService.GetUserProfileAsync(userId);

            return Ok(profileData);
        }
        [HttpGet("{username}")]
        public async Task<IActionResult> GetProfileByUsername(string username)
        {
            var profileData = await _userService.GetProfileByUsernameAsync(username);
            return Ok(profileData);
        }
    }
}
