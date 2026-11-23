using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using System.Globalization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEventCategoryRepository _categoryRepository;
        private readonly IImageService _imageService;
        private readonly IEmailService _emailService;
        private readonly ILogger<EventService> _logger;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IValidator<CreateEventRequest> _createEventValidator;
        private readonly IValidator<GetAllEventsRequest> _getAllEventsValidator;
        private readonly IValidator<CancelEventRequest> _cancelEventValidator;
        private readonly IEventCancellationJob _eventCancellationJob;

        public EventService(
            IEventRepository eventRepository,
            IEventCategoryRepository categoryRepository,
            IImageService imageService,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IValidator<CreateEventRequest> createEventValidator,
            IValidator<GetAllEventsRequest> getAllEventsValidator,
            IUserRepository userRepository,
            IValidator<CancelEventRequest> cancelEventValidator,
            IEmailService emailService,
            ILogger<EventService> logger,
            IEventCancellationJob eventCancellationJob)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
            _imageService = imageService;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _createEventValidator = createEventValidator;
            _getAllEventsValidator = getAllEventsValidator;
            _userRepository = userRepository;
            _cancelEventValidator = cancelEventValidator;
            _emailService = emailService;
            _logger = logger;
            _eventCancellationJob = eventCancellationJob;
        }

        public async Task<string> CreateEventAsync(CreateEventRequest request, Guid userId)
        {
            await _createEventValidator.ValidateAndThrowCustomAsync(request);

            var userActiveEvents = await _eventRepository.GetAllAsync(e =>
                e.UserId == userId &&
                e.EventDate > DateTime.UtcNow &&
                e.IsDeleted == false &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected);

            if (userActiveEvents.Count >= 2)
                throw new ConflictException(_localizer["Event_MaxActiveEventsReached"]?.Value ?? _localizer["Event_HasActiveEvent"].Value);

            var hasConflictingEvent = userActiveEvents.Any(e =>
                Math.Abs((e.EventDate - request.EventDate).TotalHours) < 1);

            if (hasConflictingEvent)
                throw new ConflictException(_localizer["Event_TimeConflict"]?.Value ?? "Mevcut etkinliğinizle aranızda en az 1 saat fark olmalıdır.");

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
                throw new NotFoundException(_localizer["Event_CategoryNotFound"].Value);

            string? imageUrl = null;
            string? imagePublicId = null;
            if (request.ImageFile != null)
            {
                var uploadResult = await _imageService.UploadImageAsync(request.ImageFile, "Events");
                imageUrl = uploadResult.Url;
                imagePublicId = uploadResult.PublicId;
            }

            var newEvent = _mapper.Map<Event>(request);
            newEvent.UserId = userId;
            newEvent.ImageUrl = imageUrl;
            newEvent.ImagePublicId = imagePublicId;

            await _eventRepository.AddAsync(newEvent);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Created"].Value;
        }

        public async Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(
            GetAllEventsRequest request,
            Guid currentUserId,
            bool isAdmin = false)
        {
            await _getAllEventsValidator.ValidateAndThrowCustomAsync(request);

            var statusFilter = isAdmin ? request.Status : EventStatus.Approved;

            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(
                request.PageNumber,
                request.PageSize,
                request.OnlyActive,
                request.SearchTerm,
                request.CategoryId,
                statusFilter);

            var eventDetailResponses = _mapper.Map<List<EventDetailResponse>>(items);

            var eventIds = items.Select(i => i.Id).ToList();

            var joinedEventIds = await _eventRepository.GetJoinedEventIdsByUserAsync(eventIds, currentUserId);

            var joinedEventIdSet = joinedEventIds.ToHashSet();

            var itemDict = items.ToDictionary(i => i.Id);

            foreach (var response in eventDetailResponses)
            {
                if (itemDict.TryGetValue(response.Id, out var original))
                {
                    response.IsCreator = (original.UserId == currentUserId);
                    response.IsJoined = joinedEventIdSet.Contains(original.Id);
                }
            }

            eventDetailResponses.MapListWithLocalization(items, _localizer);

            return new PaginatedResult<EventDetailResponse>
            {
                Items = eventDetailResponses,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        public async Task<List<EventCategoryResponse>> GetCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            var response = categories.Select(c => new EventCategoryResponse
            {
                Id = c.Id,
                Name = _localizer[c.Name].Value
            }).ToList();

            return response;
        }

        public async Task<EventDetailResponse> GetEventByIdAsync(Guid eventId, Guid currentUserId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);

            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            var eventDetailResponse = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
            {
                eventDetailResponse.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";
                eventDetailResponse.Department = eventEntity.User.Department?.Name;
                eventDetailResponse.Grade = eventEntity.User.Grade;
            }

            eventDetailResponse.MapWithLocalization(eventEntity, _localizer);

            eventDetailResponse.IsCreator = (eventEntity.UserId == currentUserId);
            eventDetailResponse.IsJoined = await _eventRepository.IsUserJoinedEventAsync(eventId, currentUserId);

            return eventDetailResponse;
        }

        public async Task<List<EventDetailResponse>> GetMyActiveEventAsync(Guid userId)
        {
            var myEvents = await _eventRepository.GetActiveEventByUserIdAsync(userId);

            if (myEvents == null || !myEvents.Any())
                return new List<EventDetailResponse>();

            var eventDetailResponses = _mapper.Map<List<EventDetailResponse>>(myEvents);

            for (int i = 0; i < myEvents.Count; i++)
            {
                var eventEntity = myEvents[i];
                var response = eventDetailResponses[i];

                if (eventEntity.User != null)
                {
                    response.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";
                    response.Department = eventEntity.User.Department?.Name;
                    response.Grade = eventEntity.User.Grade;
                }

                response.MapWithLocalization(eventEntity, _localizer);
                response.IsCreator = true;
            }

            return eventDetailResponses;
        }

        public async Task<List<EventDetailResponse>> GetMyJoinedEventsAsync(Guid userId)
        {
            var events = await _eventRepository.GetJoinedEventsByUserIdAsync(userId);

            if (events == null || !events.Any())
                return new List<EventDetailResponse>();

            var eventDetailResponses = _mapper.Map<List<EventDetailResponse>>(events);

            for (int i = 0; i < events.Count; i++)
            {
                var eventEntity = events[i];
                var response = eventDetailResponses[i];

                response.IsCreator = (eventEntity.UserId == userId);
                response.IsJoined = true;
            }

            eventDetailResponses.MapListWithLocalization(events, _localizer);
            return eventDetailResponses;
        }

        public async Task<string> JoinEventAsync(Guid eventId, Guid userId)
        {
            var eventEntity = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            if (eventEntity.Status != EventStatus.Approved)
                throw new BadRequestException(_localizer["Event_NotApproved"].Value);

            var now = DateTime.UtcNow;

            if (eventEntity.EventDate <= now)
                throw new BadRequestException(_localizer["Event_PastDate"].Value);

            if (eventEntity.UserId == userId)
                throw new BadRequestException(_localizer["Event_CannotJoinOwnEvent"].Value);

            var userWithDept = await _userRepository.GetUserWithDetailsByIdAsync(userId);
            if (userWithDept == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrWhiteSpace(eventEntity.TargetFaculty) &&
                !EqualsTurkishIgnoreCase(userWithDept.Department?.Faculty?.Name, eventEntity.TargetFaculty))
            {
                throw new BadRequestException(_localizer["Event_FacultyRestriction"].Value);
            }

            if (!string.IsNullOrWhiteSpace(eventEntity.TargetDepartment) &&
                !EqualsTurkishIgnoreCase(userWithDept.Department?.Name, eventEntity.TargetDepartment))
            {
                throw new BadRequestException(_localizer["Event_DepartmentRestriction"].Value);
            }

            if (userWithDept.Role == UserRole.Student && userWithDept.Grade.HasValue)
            {
                var userGradeInt = (int)userWithDept.Grade.Value;

                if (eventEntity.MinGrade.HasValue && userGradeInt < eventEntity.MinGrade.Value)
                    throw new BadRequestException(_localizer["Event_GradeTooLow"].Value);

                if (eventEntity.MaxGrade.HasValue && userGradeInt > eventEntity.MaxGrade.Value)
                    throw new BadRequestException(_localizer["Event_GradeTooHigh"].Value);
            }

            var lastAttendee = await _eventRepository.GetLastAttendeeIncludingDeletedAsync(eventId, userId, trackChanges: true);

            if (lastAttendee != null)
            {
                if (!lastAttendee.IsDeleted && lastAttendee.IsActive)
                    throw new ConflictException(_localizer["Event_AlreadyJoined"].Value);

                if (lastAttendee.IsDeleted && lastAttendee.UpdatedAt.HasValue)
                {
                    var joinTime = lastAttendee.JoinedAt ?? lastAttendee.CreatedAt;
                    var leftTime = lastAttendee.UpdatedAt.Value;

                    var stayedDuration = leftTime - joinTime;
                    var timeSinceLeft = now - leftTime;

                    if (stayedDuration.TotalMinutes <= 3 && timeSinceLeft.TotalMinutes < 5)
                    {
                        int remainingMinutes = Math.Max(1, (int)Math.Ceiling(5 - timeSinceLeft.TotalMinutes));
                        throw new BadRequestException(
                            _localizer["Event_RejoinCooldown", remainingMinutes]?.Value
                            ?? $"Etkinliğe kısa sürede katılıp ayrıldığınız için {remainingMinutes} dakika boyunca tekrar katılamazsınız.");
                    }
                }

                await EnsureEventHasCapacityAsync(eventEntity, eventId);

                lastAttendee.IsDeleted = false;
                lastAttendee.IsActive = true;
                lastAttendee.JoinedAt = now;
                lastAttendee.UpdatedAt = now;

                await _unitOfWork.SaveChangesAsync();
                return _localizer["Res_Event_Joined"].Value;
            }

            await EnsureEventHasCapacityAsync(eventEntity, eventId);

            var attendee = new EventAttendee
            {
                EventId = eventId,
                UserId = userId,
                JoinedAt = now
            };

            await _eventRepository.AddAttendeeAsync(attendee);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Joined"].Value;
        }

        private async Task EnsureEventHasCapacityAsync(Event eventEntity, Guid eventId)
        {
            var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);
            if (participants.Count >= eventEntity.Capacity)
            {
                throw new BadRequestException(
                    _localizer["Event_CapacityFull"]?.Value
                    ?? "Bu etkinliğin katılımcı kontenjanı dolmuştur.");
            }
        }

        public async Task<string> CancelEventAsync(Guid eventId, Guid userId, CancelEventRequest request)
        {
            await _cancelEventValidator.ValidateAndThrowCustomAsync(request);

            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted, trackChanges: true);

            if (existingEvent == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            if (existingEvent.UserId != userId)
                throw new ForbiddenException(_localizer["Event_UnauthorizedCancel"].Value);

            if (existingEvent.Status == EventStatus.Cancelled)
                throw new BadRequestException(_localizer["Event_AlreadyCancelled"].Value);

            var timeDifference = existingEvent.EventDate - DateTime.UtcNow;

            if (timeDifference.TotalHours <= 0)
                throw new BadRequestException(_localizer["Event_CannotCancelPast"].Value);

            if (timeDifference.TotalHours < 4)
                throw new BadRequestException(_localizer["Event_CannotCancelClose"].Value);

            existingEvent.Status = EventStatus.Cancelled;
            existingEvent.CancellationReason = request.Reason;

            await _unitOfWork.SaveChangesAsync();

            try
            {
                var organizer = await _userRepository.GetUserWithDetailsByIdAsync(userId);
                if (organizer != null && !string.IsNullOrEmpty(organizer.Email))
                {
                    string organizerSubject = _localizer["EventCancelledOrganizerSubject"].Value;
                    string organizerTemplate = _localizer["EventCancelledOrganizerBody"].Value;
                    string organizerBody = string.Format(organizerTemplate, organizer.FirstName, existingEvent.Title, request.Reason);

                    await _emailService.SendEmailAsync(organizer.Email, organizerSubject, organizerBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Organizatör iptal maili gönderilemedi. EventId: {EventId}", eventId);
            }

            try
            {
                _eventCancellationJob.Enqueue(eventId, request.Reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Katılımcı iptal maili işi kuyruğa eklenemedi. EventId: {EventId}", eventId);
            }

            return _localizer["Res_Event_Cancelled"].Value;
        }

        public async Task<List<ParticipantResponse>> GetEventParticipantsAsync(Guid eventId)
        {
            var eventExists = await _eventRepository.AnyAsync(e => e.Id == eventId && !e.IsDeleted);

            if (!eventExists)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);

            if (participants == null || !participants.Any())
                return new List<ParticipantResponse>();

            return _mapper.Map<List<ParticipantResponse>>(participants);
        }

        public async Task<EventStatisticsResponse> GetEventStatisticsAsync()
        {
            var totalCreatedCount = await _eventRepository.CountAsync(e => !e.IsDeleted);

            var activeCount = await _eventRepository.CountAsync(e =>
                !e.IsDeleted &&
                e.EventDate > DateTime.UtcNow &&
                e.Status == EventStatus.Approved);

            var pendingCount = await _eventRepository.CountAsync(e =>
                !e.IsDeleted &&
                e.Status == EventStatus.Pending);

            return new EventStatisticsResponse
            {
                TotalCreatedEvents = totalCreatedCount,
                ActiveEvents = activeCount,
                PendingEvents = pendingCount
            };
        }

        public async Task<string> LeaveEventAsync(Guid eventId, Guid userId)
        {
            var eventEntity = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            var now = DateTime.UtcNow;

            if (eventEntity.EventDate <= now)
                throw new BadRequestException(_localizer["Event_CannotLeavePast"].Value);

            var attendee = await _eventRepository.GetAttendeeAsync(eventId, userId);
            if (attendee == null)
                throw new NotFoundException(_localizer["Event_NotJoined"].Value);

            _eventRepository.RemoveAttendee(attendee);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_LeftSuccessfully"].Value;
        }

        private static bool EqualsTurkishIgnoreCase(string? left, string? right)
        {
            if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right))
                return false;

            var trCulture = CultureInfo.GetCultureInfo("tr-TR");
            return string.Compare(left.Trim(), right.Trim(), trCulture, CompareOptions.IgnoreCase) == 0;
        }
    }
}