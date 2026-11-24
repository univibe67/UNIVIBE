using AutoMapper;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
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
        private readonly IEventCancellationJob _eventCancellationJob;
        private readonly ILogger<AdminUserService> _logger;



        public AdminUserService(
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStringLocalizer<SharedResources> localizer,
            IEventRepository eventRepository,
            IEventCancellationJob eventCancellationJob,
            ILogger<AdminUserService> logger)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
            _eventRepository = eventRepository;
            _eventCancellationJob = eventCancellationJob;
            _logger = logger;
        }

        public async Task<PaginatedResult<UserListResponse>> GetAllUsersAsync(int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (items, totalCount) = await _userRepository.GetPagedUsersIncludingDeletedAsync(pageNumber, pageSize);

            var userResponses = _mapper.Map<List<UserListResponse>>(items);

            return new PaginatedResult<UserListResponse>
            {
                Items = userResponses,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<string> ChangeUserRoleAsync(Guid userId, UserRole newRole, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException(_localizer["Admin_CannotChangeOwnRole"].Value);

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId, trackChanges: true);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.Role = newRole;

            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_RoleChanged"].Value;
        }

        public async Task<string> SuspendUserAsync(Guid userId, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException(_localizer["Admin_CannotSuspendOwnAccount"].Value);

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId, trackChanges: true);

            if (user == null || user.IsDeleted)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.IsActive = false;
            user.RefreshToken = null;

            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Suspended"].Value;
        }

        public async Task<string> ActivateUserAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId, trackChanges: true);

            if (user == null)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            user.IsActive = true;
            user.IsDeleted = false;
            user.IsBannedByAdmin = false;
            user.DeletedAt = null;

            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_User_Activated"].Value;
        }

        public async Task<string> DeleteUserAsync(Guid userId, Guid currentAdminId)
        {
            if (currentAdminId == userId)
                throw new BadRequestException(_localizer["Admin_CannotDeleteOwnAccount"].Value);

            var user = await _userRepository.GetByIdIncludingDeletedAsync(userId, trackChanges: true);

            if (user == null || user.IsDeleted)
                throw new NotFoundException(_localizer["Res_User_NotFound"].Value);

            var now = DateTime.UtcNow;

            var userActiveEvents = await _eventRepository.GetAllAsync(e =>
                e.UserId == userId &&
                !e.IsDeleted &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected &&
                e.EventDate >= now,
                trackChanges: true);

            string cancellationReason = _localizer["Event_OrganizerAdminDeletedReason"].Value;

            foreach (var ev in userActiveEvents)
            {
                ev.Status = EventStatus.Cancelled;
                ev.IsActive = false;
                ev.CancellationReason = cancellationReason;

                var eventWithAttendees = await _eventRepository.GetEventWithDetailsByIdAsync(ev.Id, trackChanges: true);
                if (eventWithAttendees?.Attendees != null)
                {
                    foreach (var attendee in eventWithAttendees.Attendees.Where(a => !a.IsDeleted))
                    {
                        attendee.IsDeleted = true;
                        attendee.IsActive = false;
                    }
                }
            }

            await _eventRepository.RemoveAttendeesByUserIdAsync(userId);

            user.IsDeleted = true;
            user.IsBannedByAdmin = true;
            user.DeletedAt = now;
            user.IsActive = false;
            user.RefreshToken = null;

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

            return _localizer["Res_User_Deleted"].Value;
        }
    }
}