using Microsoft.AspNetCore.Http;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;

namespace UniVibe.Application.Interfaces
{
    public interface IUserService
    {
        Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage);
        Task UpdateProfileAsync(Guid userId, UpdateUserProfileRequest updateDto);
        Task<UserProfileResponse> GetUserProfileAsync(Guid userId);
        Task<PublicUserProfileResponse> GetProfileByUsernameAsync(string username);
        Task DeleteAccountAsync(Guid userId);
    }
}
