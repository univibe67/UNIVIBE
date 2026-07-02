using Microsoft.AspNetCore.Http;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;

namespace UniVibe.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IImageService _imageService;

        public UserService(IUserRepository userRepository, IImageService imageService)
        {
            _userRepository = userRepository;
            _imageService = imageService;
        }
        public async Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            if (!string.IsNullOrEmpty(user.ProfilePicturePublicId))
            {
                await _imageService.DeleteImageAsync(user.ProfilePicturePublicId);
            }

            var uploadResult = await _imageService.UploadImageAsync(profileImage, "Users");

            user.ProfilePictureUrl = uploadResult.Url;
            user.ProfilePicturePublicId = uploadResult.PublicId;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);

            return user.ProfilePictureUrl;
        }
        public async Task UpdateProfileAsync(Guid userId, UpdateUserProfileDto updateDto)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            if (!string.IsNullOrWhiteSpace(updateDto.Username) && updateDto.Username != user.Username)
            {
                if (user.LastUsernameUpdatedAt.HasValue)
                {
                    var daysSinceLastUpdate = (DateTime.UtcNow - user.LastUsernameUpdatedAt.Value).TotalDays;
                    if (daysSinceLastUpdate < 30)
                    {
                        var remainingDays = 30 - (int)daysSinceLastUpdate;
                        throw new Exception($"Kullanıcı adınızı değiştirmek için {remainingDays} gün daha beklemelisiniz.");
                    }
                }
                var isUsernameTaken = await _userRepository.AnyAsync(u => u.Username.ToLower() == updateDto.Username.ToLower());

                if (isUsernameTaken)
                    throw new Exception("Bu kullanıcı adı zaten kullanılıyor, lütfen başka bir tane belirleyin.");

                user.Username = updateDto.Username;
                user.LastUsernameUpdatedAt = DateTime.UtcNow;
            }

            user.Bio = updateDto.Bio;
            user.SocialMediaLink = updateDto.SocialMediaLink;

            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
        }

    }
}
