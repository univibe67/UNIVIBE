using AutoMapper;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
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
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IValidator<UpdateUserProfileRequest> _updateProfileValidator;

        public UserService(
            IUserRepository userRepository,
            IImageService imageService,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IValidator<UpdateUserProfileRequest> updateProfileValidator)
        {
            _userRepository = userRepository;
            _imageService = imageService;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _updateProfileValidator = updateProfileValidator;
        }

        public async Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new Exception(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrEmpty(user.ProfilePicturePublicId))
            {
                await _imageService.DeleteImageAsync(user.ProfilePicturePublicId);
            }

            var uploadResult = await _imageService.UploadImageAsync(profileImage, "Users");

            user.ProfilePictureUrl = uploadResult.Url;
            user.ProfilePicturePublicId = uploadResult.PublicId;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return user.ProfilePictureUrl;
        }

        public async Task<string> UpdateProfileAsync(Guid userId, UpdateUserProfileRequest updateDto)
        {
            var validationResult = await _updateProfileValidator.ValidateAsync(updateDto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new Exception(string.Join(" • ", errors));
            }

            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new Exception(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrWhiteSpace(updateDto.Username) && updateDto.Username != user.Username)
            {
                if (user.LastUsernameUpdatedAt.HasValue)
                {
                    var daysSinceLastUpdate = (DateTime.UtcNow - user.LastUsernameUpdatedAt.Value).TotalDays;
                    if (daysSinceLastUpdate < 30)
                    {
                        var remainingDays = 30 - (int)daysSinceLastUpdate;
                        throw new Exception(_localizer["User_UsernameWaitTime", remainingDays].Value);
                    }
                }
                var isUsernameTaken = await _userRepository.AnyAsync(u =>
                    u.Id != userId &&
                    u.Username.ToLower() == updateDto.Username.ToLower());

                if (isUsernameTaken)
                    throw new Exception(_localizer["User_UsernameTaken"].Value);

                user.Username = updateDto.Username;
                user.LastUsernameUpdatedAt = DateTime.UtcNow;
            }

            user.Bio = updateDto.Bio;
            user.SocialMediaLink = updateDto.SocialMediaLink;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_ProfileUpdated"].Value;
        }

        public async Task<UserProfileResponse> GetUserProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetUserWithDetailsByIdAsync(userId);

            if (user == null)
                throw new Exception(_localizer["User_NotFound"].Value);

            return _mapper.Map<UserProfileResponse>(user);
        }

        public async Task<PublicUserProfileResponse> GetProfileByUsernameAsync(string username)
        {
            var user = await _userRepository.GetUserWithDetailsByUsernameAsync(username);

            if (user == null)
                throw new Exception(_localizer["User_NotFound"].Value);

            return _mapper.Map<PublicUserProfileResponse>(user);
        }

        public async Task<string> DeleteAccountAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new Exception(_localizer["User_NotFound"].Value);

            user.IsActive = false;
            user.IsDeleted = true;

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;

            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_AccountFrozen"].Value;
        }
    }
}