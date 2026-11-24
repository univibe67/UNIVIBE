using AutoMapper;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminEventService : IAdminEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly ILogger<AdminEventService> _logger;
        private readonly IEventCancellationJob _eventCancellationJob;

        public AdminEventService(
            IEventRepository eventRepository,
            IUserRepository userRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStringLocalizer<SharedResources> localizer,
            ILogger<AdminEventService> logger,
            IEventCancellationJob eventCancellationJob)
        {
            _eventRepository = eventRepository;
            _userRepository = userRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
            _logger = logger;
            _eventCancellationJob = eventCancellationJob;
        }

        public async Task<PaginatedResult<EventListResponse>> GetPendingEventsAsync(int pageNumber = 1, int pageSize = 10)
        {
            pageNumber = pageNumber < 1 ? 1 : pageNumber;
            pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 100);

            var (pendingEvents, totalCount) = await _eventRepository.GetPagedEventsAsync(
                pageNumber,
                pageSize,
                onlyActive: false,
                status: EventStatus.Pending);

            var response = _mapper.Map<List<EventListResponse>>(pendingEvents);
            response.MapListWithLocalization(pendingEvents, _localizer);

            return new PaginatedResult<EventListResponse>
            {
                Items = response,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<PaginatedResult<EventListResponse>> GetAllEventsAsync(int pageNumber = 1, int pageSize = 10)
        {
            pageNumber = pageNumber < 1 ? 1 : pageNumber;
            pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 100);

            var (allEvents, totalCount) = await _eventRepository.GetPagedEventsAsync(
                pageNumber,
                pageSize,
                onlyActive: false,
                status: null);

            var response = _mapper.Map<List<EventListResponse>>(allEvents);
            response.MapListWithLocalization(allEvents, _localizer);

            return new PaginatedResult<EventListResponse>
            {
                Items = response,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<string> ApproveEventAsync(Guid eventId)
        {
            var evnt = await GetEventOrThrowAsync(eventId);

            ValidateEventForApproval(evnt);

            var organizer = await _userRepository.GetByIdIncludingDeletedAsync(evnt.UserId, trackChanges: false);
            if (organizer == null || organizer.IsDeleted || !organizer.IsActive || organizer.IsBannedByAdmin)
            {
                evnt.Status = EventStatus.Cancelled;
                evnt.IsActive = false;
                evnt.CancellationReason = _localizer["Event_OrganizerUnavailableReason"]?.Value
                    ?? "Organizatör hesabı aktif olmadığı için etkinlik onaylanamadı.";

                await _unitOfWork.SaveChangesAsync();

                throw new BadRequestException(_localizer["Admin_EventOrganizerUnavailable"]?.Value
                    ?? "Organizatör hesabı silinmiş, pasif veya banlanmış olduğu için etkinlik onaylanamaz.");
            }

            evnt.Status = EventStatus.Approved;
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Approved"].Value;
        }

        public async Task<string> RejectEventAsync(Guid eventId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new BadRequestException(_localizer["Res_Event_ReasonRequired"].Value);

            var evnt = await _eventRepository.GetEventWithDetailsByIdAsync(eventId, trackChanges: true);
            if (evnt == null || evnt.IsDeleted)
                throw new NotFoundException(_localizer["Res_Event_NotFound"].Value);

            ValidateEventForRejection(evnt);

            var wasApproved = evnt.Status == EventStatus.Approved;

            evnt.Status = EventStatus.Rejected;
            evnt.RejectionReason = reason;

            await _unitOfWork.SaveChangesAsync();

            if (evnt.User != null && !string.IsNullOrEmpty(evnt.User.Email))
            {
                try
                {
                    string subject = _localizer["EventRejectedEmailSubject"].Value;
                    string template = _localizer["EventRejectedEmailBody"].Value;
                    string mailBody = string.Format(template, evnt.User.FirstName, evnt.Title, reason);

                    await _emailService.SendEmailAsync(evnt.User.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Etkinlik ret e-postası gönderilemedi. EventId: {EventId}, UserId: {UserId}", eventId, evnt.UserId);
                }
            }

            if (wasApproved && evnt.Attendees != null && evnt.Attendees.Any(a => !a.IsDeleted))
            {
                try
                {
                    _eventCancellationJob.Enqueue(eventId, reason);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Onaylı etkinlik reddedildikten sonra katılımcı bildirim işi kuyruğa eklenemedi. EventId: {EventId}", eventId);
                }
            }

            return _localizer["Res_Event_Rejected"].Value;
        }

        public async Task<EventDetailResponse> GetEventDetailsByIdAsync(Guid eventId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);
            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            return MapAndEnrichAdminEventDetail(eventEntity);
        }

        #region Private Helper Methods

        private async Task<Event> GetEventOrThrowAsync(Guid eventId)
        {
            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted, trackChanges: true);
            if (evnt == null)
                throw new NotFoundException(_localizer["Res_Event_NotFound"].Value);
            return evnt;
        }

        private void ValidateEventForApproval(Event evnt)
        {
            if (evnt.Status == EventStatus.Cancelled)
                throw new BadRequestException(_localizer["Admin_EventCannotApproveCancelled"].Value);

            if (evnt.EventDate <= DateTime.UtcNow)
                throw new BadRequestException(_localizer["Admin_EventCannotApprovePast"].Value);

            if (evnt.Status != EventStatus.Pending)
                throw new BadRequestException(_localizer["Admin_EventMustBePendingToApprove"].Value);
        }

        private void ValidateEventForRejection(Event evnt)
        {
            if (evnt.Status == EventStatus.Cancelled)
                throw new BadRequestException(_localizer["Admin_EventCannotRejectCancelled"].Value);

            if (evnt.Status == EventStatus.Rejected)
                throw new BadRequestException(_localizer["Admin_EventAlreadyRejected"].Value);

            if (evnt.EventDate <= DateTime.UtcNow)
                throw new BadRequestException(_localizer["Admin_EventCannotRejectPast"].Value);

            if (evnt.Status != EventStatus.Pending && evnt.Status != EventStatus.Approved)
                throw new BadRequestException(_localizer["Admin_EventMustBePendingOrApprovedToReject"].Value);
        }

        private EventDetailResponse MapAndEnrichAdminEventDetail(Event eventEntity)
        {
            var response = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
            {
                response.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";
                response.Department = eventEntity.User.Department?.Name;
                response.Grade = eventEntity.User.Grade;
            }

            response.MapWithLocalization(eventEntity, _localizer);

            response.RejectionReason = eventEntity.RejectionReason;
            response.CancellationReason = eventEntity.CancellationReason;
            response.IsDeleted = eventEntity.IsDeleted;
            response.IsCreator = false;

            return response;
        }

        #endregion
    }
}