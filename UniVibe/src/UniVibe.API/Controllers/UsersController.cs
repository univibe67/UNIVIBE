using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public sealed class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IValidator<UpdateUserProfileRequest> _updateProfileValidator;

        public UsersController(IUserService userService, IValidator<UpdateUserProfileRequest> updateProfileValidator)
        {
            _userService = userService;
            _updateProfileValidator = updateProfileValidator;
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile profileImage)
        {
            var userId = User.GetUserId();
            var newImageUrl = await _userService.UploadProfilePictureAsync(userId, profileImage);

            return Ok(ApiResponse<string>.Success(newImageUrl));
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest updateDto)
        {
            var validationResult = await _updateProfileValidator.ValidateAsync(updateDto);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<string>.Fail(errors));
            }

            var userId = User.GetUserId();
            await _userService.UpdateProfileAsync(userId, updateDto);
            return Ok(ApiResponse<string>.Success(ResponseMessages.User.ProfileUpdated));
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.GetUserId();

            var profileData = await _userService.GetUserProfileAsync(userId);

            return Ok(ApiResponse<UserProfileResponse>.Success(profileData));
        }

        [HttpGet("profile/{username}")]
        public async Task<IActionResult> GetProfileByUsername(string username)
        {
            var profileData = await _userService.GetProfileByUsernameAsync(username);
            return Ok(ApiResponse<PublicUserProfileResponse>.Success(profileData));
        }

        [HttpDelete("delete-account")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = User.GetUserId();

            await _userService.DeleteAccountAsync(userId);

            return Ok(ApiResponse<string>.Success(ResponseMessages.User.AccountFrozen));
        }
    }
}
