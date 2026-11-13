using AutoMapper;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Requests;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IEventRepository _eventRepository;
        private readonly IImageService _imageService;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IValidator<UpdateUserProfileRequest> _updateProfileValidator;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            IImageService imageService,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IValidator<UpdateUserProfileRequest> updateProfileValidator,
            IEmailService emailService,
            IPasswordHasher passwordHasher,
            IEventRepository eventRepository,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _imageService = imageService;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _updateProfileValidator = updateProfileValidator;
            _emailService = emailService;
            _passwordHasher = passwordHasher;
            _eventRepository = eventRepository;
            _logger = logger;
        }

        public async Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrEmpty(user.ProfilePicturePublicId))
            {
                await _imageService.DeleteImageAsync(user.ProfilePicturePublicId);
            }

            var uploadResult = await _imageService.UploadImageAsync(profileImage, "Users");

            user.ProfilePictureUrl = uploadResult.Url;
            user.ProfilePicturePublicId = uploadResult.PublicId;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return user.ProfilePictureUrl;
        }

        public async Task<string> UpdateProfileAsync(Guid userId, UpdateUserProfileRequest updateDto)
        {
            await _updateProfileValidator.ValidateAndThrowCustomAsync(updateDto);

            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrWhiteSpace(updateDto.Username) && updateDto.Username != user.Username)
            {
                if (user.LastUsernameUpdatedAt.HasValue)
                {
                    var daysSinceLastUpdate = (DateTime.UtcNow - user.LastUsernameUpdatedAt.Value).TotalDays;
                    if (daysSinceLastUpdate < 30)
                    {
                        var remainingDays = 30 - (int)daysSinceLastUpdate;
                        throw new BadRequestException(_localizer["User_UsernameWaitTime", remainingDays].Value);
                    }
                }
                var isUsernameTaken = await _userRepository.AnyAsync(u =>
                    u.Id != userId &&
                    u.Username.ToLower() == updateDto.Username.ToLower());

                if (isUsernameTaken)
                    throw new ConflictException(_localizer["User_UsernameTaken"].Value);

                user.Username = updateDto.Username;
                user.LastUsernameUpdatedAt = DateTime.UtcNow;
            }

            user.Bio = updateDto.Bio;
            user.SocialMediaLink = updateDto.SocialMediaLink;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_ProfileUpdated"].Value;
        }

        public async Task<UserProfileResponse> GetUserProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetUserWithDetailsByIdAsync(userId);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            return _mapper.Map<UserProfileResponse>(user);
        }

        public async Task<PublicUserProfileResponse> GetProfileByUsernameAsync(string username)
        {
            var user = await _userRepository.GetUserWithDetailsByUsernameAsync(username);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            return _mapper.Map<PublicUserProfileResponse>(user);
        }

        public async Task<string> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            var isPasswordValid = _passwordHasher.Verify(request.CurrentPassword, user.PasswordHash);
            if (!isPasswordValid)
                throw new BadRequestException("Mevcut şifreniz hatalı.");

            if (request.NewPassword.Length < 8)
                throw new BadRequestException(_localizer["Val_PassMinLength"].Value);

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return "Şifreniz başarıyla değiştirildi.";
        }

        public async Task<string> DeleteAccountAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            var userActiveEvents = await _eventRepository.GetAllAsync(e =>
                e.UserId == userId &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected &&
                !e.IsDeleted &&
                (e.EventDate >= DateTime.UtcNow || e.Status == EventStatus.Pending || e.Status == EventStatus.Approved));

            foreach (var eventt in userActiveEvents)
            {
                eventt.Status = EventStatus.Cancelled;
                eventt.CancellationReason = "Organizatör hesabı silindiği için etkinlik iptal edildi.";
            }

            user.IsActive = false;
            user.IsDeleted = true;
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            if (!string.IsNullOrEmpty(user.Email))
            {
                string subject = _localizer["Auth_AccountDeleteEmailSubject"].Value;
                string template = _localizer["Auth_AccountDeleteEmailBody"].Value;
                string mailBody = string.Format(template, user.FirstName);

                try
                {
                    await _emailService.SendEmailAsync(user.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Kullanıcı hesabı silindi ancak silinme bilgilendirme emaili gönderilemedi. Email: {Email}", user.Email);
                }
            }

            return _localizer["Res_User_AccountFrozen"].Value;
        }
    }
}