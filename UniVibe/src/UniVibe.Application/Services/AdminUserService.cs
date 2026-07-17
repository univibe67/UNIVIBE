using AutoMapper;
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

        public AdminUserService(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<UserListResponse>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var orderedUsers = users.OrderByDescending(u => u.CreatedAt).ToList();

            return _mapper.Map<List<UserListResponse>>(orderedUsers);
        }

        public async Task<bool> ChangeUserRoleAsync(Guid userId, UserRole newRole)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return false;

            user.Role = newRole;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> SuspendUserAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return false;

            user.IsActive = false;
            user.RefreshToken = null;
            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ActivateUserAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return false;

            user.IsActive = true;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
        public async Task<bool> DeleteUserAsync(Guid userId)
        {
            var user = await _userRepository.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.IsActive = false;
            user.RefreshToken = null;

            _userRepository.Update(user);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}