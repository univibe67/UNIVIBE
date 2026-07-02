using Microsoft.AspNetCore.Http;
using UniVibe.Application.DTOs.User;

namespace UniVibe.Application.Interfaces
{
    public interface IUserService
    {
        Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage);
        Task UpdateProfileAsync(Guid userId, UpdateUserProfileDto updateDto);
        Task<UserProfileDto> GetUserProfileAsync(Guid userId);
    }
}
