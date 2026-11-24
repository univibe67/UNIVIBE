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
        private readonly IValidator<ChangePasswordRequest> _changePasswordValidator;
        private readonly IEmailService _emailService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<UserService> _logger;
        private readonly IEventCancellationJob _eventCancellationJob;


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
            ILogger<UserService> logger,
            IValidator<ChangePasswordRequest> changePasswordValidator,
            IEventCancellationJob eventCancellationJob)
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
            _changePasswordValidator = changePasswordValidator;
            _eventCancellationJob = eventCancellationJob;
        }

        public async Task<string> UploadProfilePictureAsync(Guid userId, IFormFile profileImage)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId, trackChanges: true);
            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            var oldPublicId = user.ProfilePicturePublicId;

            var uploadResult = await _imageService.UploadImageAsync(profileImage, "Users");

            user.ProfilePictureUrl = uploadResult.Url;
            user.ProfilePicturePublicId = uploadResult.PublicId;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            if (!string.IsNullOrEmpty(oldPublicId) && !string.Equals(oldPublicId, uploadResult.PublicId, StringComparison.Ordinal))
            {
                try
                {
                    await _imageService.DeleteImageAsync(oldPublicId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Eski profil fotoğrafı silinemedi. UserId: {UserId}, PublicId: {PublicId}", userId, oldPublicId);
                }
            }

            return user.ProfilePictureUrl;
        }

        public async Task<string> UpdateProfileAsync(Guid userId, UpdateUserProfileRequest updateDto)
        {
            await _updateProfileValidator.ValidateAndThrowCustomAsync(updateDto);

            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId, trackChanges: true);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrWhiteSpace(updateDto.Username))
            {
                var normalizedNewUsername = updateDto.Username.ToLowerInvariant();

                if (normalizedNewUsername != user.Username)
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
                        u.Username == normalizedNewUsername);

                    if (isUsernameTaken)
                        throw new ConflictException(_localizer["User_UsernameTaken"].Value);

                    user.Username = normalizedNewUsername;
                    user.LastUsernameUpdatedAt = DateTime.UtcNow;
                }
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
            await _changePasswordValidator.ValidateAndThrowCustomAsync(request);

            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId, trackChanges: true);
            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            var isPasswordValid = _passwordHasher.Verify(request.CurrentPassword, user.PasswordHash);
            if (!isPasswordValid)
                throw new BadRequestException(_localizer["Auth_CurrentPasswordIncorrect"].Value);

            var isSameAsOld = _passwordHasher.Verify(request.NewPassword, user.PasswordHash);
            if (isSameAsOld)
                throw new BadRequestException(_localizer["Auth_NewPasswordSameAsOld"].Value);

            user.PasswordHash = _passwordHasher.Hash(request.NewPassword);

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_PasswordChangedSuccessfully"].Value;
        }

        public async Task<string> DeleteAccountAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId, trackChanges: true);

            if (user == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            var userActiveEvents = await _eventRepository.GetAllAsync(e =>
                e.UserId == userId &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected &&
                !e.IsDeleted &&
                (e.EventDate >= DateTime.UtcNow || e.Status == EventStatus.Pending || e.Status == EventStatus.Approved),
                trackChanges: true);

            string cancellationReason = _localizer["Event_OrganizerDeletedReason"].Value;
            foreach (var ev in userActiveEvents)
            {
                ev.Status = EventStatus.Cancelled;
                ev.CancellationReason = cancellationReason;
            }

            await _eventRepository.RemoveAttendeesByUserIdAsync(userId);

            user.IsActive = false;
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            foreach (var ev in userActiveEvents)
            {
                try
                {
                    _eventCancellationJob.Enqueue(ev.Id, cancellationReason);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Katılımcı iptal maili işi kuyruğa eklenemedi. EventId: {EventId}", ev.Id);
                }
            }

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
                    string logTemplate = _localizer["Log_AccountDeletionEmailFailed"].Value;
                    _logger.LogError(ex, logTemplate, user.Email);
                }
            }

            return _localizer["Res_User_AccountFrozen"].Value;
        }
    }
}