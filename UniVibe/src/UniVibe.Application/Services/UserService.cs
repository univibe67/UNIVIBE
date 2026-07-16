using AutoMapper;
using Microsoft.AspNetCore.Http;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;

namespace UniVibe.Application.Services
{
    public sealed class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IImageService _imageService;
        private readonly IMapper _mapper;

        public UserService(IUserRepository userRepository, IImageService imageService, IMapper mapper)
        {
            _userRepository = userRepository;
            _imageService = imageService;
            _mapper = mapper;
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
        public async Task UpdateProfileAsync(Guid userId, UpdateUserProfileRequest updateDto)
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
        public async Task<UserProfileResponse> GetUserProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetUserWithDetailsByIdAsync(userId);

            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            return _mapper.Map<UserProfileResponse>(user);
        }
        public async Task<PublicUserProfileResponse> GetProfileByUsernameAsync(string username)
        {
            var user = await _userRepository.GetUserWithDetailsByUsernameAsync(username);

            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            return _mapper.Map<PublicUserProfileResponse>(user);
        }
        public async Task DeleteAccountAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            user.IsActive = false;

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;

            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
        }

    }
}
