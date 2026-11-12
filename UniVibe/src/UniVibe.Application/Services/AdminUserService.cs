using AutoMapper;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminUserService : IAdminUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IEventRepository _eventRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public AdminUserService(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper, IStringLocalizer<SharedResources> localizer, IEventRepository eventRepository)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
            _eventRepository = eventRepository;
        }

        public async Task<List<UserListResponse>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllIncludingDeletedAsync();

            return _mapper.Map<List<UserListResponse>>(users);
        }

        public async Task<string> ChangeUserRoleAsync(Guid userId, UserRole newRole, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException("Kendi rolünüzü değiştiremezsiniz.");

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.Role = newRole;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_RoleChanged"].Value;
        }

        public async Task<string> SuspendUserAsync(Guid userId, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException("Kendi hesabınızı askıya alamazsınız.");

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.IsActive = false;
            user.RefreshToken = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Suspended"].Value;
        }

        public async Task<string> ActivateUserAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.IsActive = true;
            user.IsDeleted = false;
            user.DeletedAt = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Activated"].Value;
        }

        public async Task<string> DeleteUserAsync(Guid userId, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException("Kendi hesabınızı silemezsiniz.");

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            var userActiveEvents = await _eventRepository.GetAllAsync(e =>
                e.UserId == userId &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected &&
                !e.IsDeleted &&
                (e.EventDate >= DateTime.UtcNow || e.Status == EventStatus.Pending || e.Status == EventStatus.Approved));

            foreach (var ev in userActiveEvents)
            {
                ev.Status = EventStatus.Cancelled;
                ev.CancellationReason = "Organizatör hesabı yönetici tarafından silindiği için etkinlik iptal edildi.";
                ev.UpdatedAt = DateTime.UtcNow;
                _eventRepository.Update(ev);
            }

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.IsActive = false;
            user.RefreshToken = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Deleted"].Value;
        }
    }
}