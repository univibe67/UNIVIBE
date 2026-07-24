using AutoMapper;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.User.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminUserService : IAdminUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public AdminUserService(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper, IStringLocalizer<SharedResources> localizer)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
        }

        public async Task<List<UserListResponse>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllIncludingDeletedAsync();

            return _mapper.Map<List<UserListResponse>>(users);
        }

        public async Task<string> ChangeUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new Exception(_localizer["Res_User_NotFound"].Value);

            user.Role = newRole;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_RoleChanged"].Value;
        }

        public async Task<string> SuspendUserAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new Exception(_localizer["Res_User_NotFound"].Value);

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
                throw new Exception(_localizer["Res_User_NotFound"].Value);

            user.IsActive = true;
            user.IsDeleted = false;
            user.DeletedAt = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Activated"].Value;
        }

        public async Task<string> DeleteUserAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId);

            if (user == null)
                throw new Exception(_localizer["Res_User_NotFound"].Value);

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