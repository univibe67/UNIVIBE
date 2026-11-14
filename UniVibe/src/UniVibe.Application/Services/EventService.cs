using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
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
            ILogger<EventService> logger)
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
        }

        public async Task<string> CreateEventAsync(CreateEventRequest request, Guid userId)
        {
            await _createEventValidator.ValidateAndThrowCustomAsync(request);

            var hasActiveEvent = await _eventRepository.AnyAsync(e =>
                e.UserId == userId &&
                e.EventDate > DateTime.UtcNow &&
                e.IsDeleted == false &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected);

            if (hasActiveEvent)
                throw new ConflictException(_localizer["Event_HasActiveEvent"].Value);

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

            try
            {
                var organizer = await _userRepository.GetUserWithDetailsByIdAsync(userId);
                if (organizer != null && !string.IsNullOrEmpty(organizer.Email))
                {
                    var turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
                    var localEventTime = TimeZoneInfo.ConvertTimeFromUtc(newEvent.EventDate, turkeyTimeZone);
                    var formattedDate = localEventTime.ToString("dd.MM.yyyy");
                    var formattedTime = localEventTime.ToString("HH:mm");

                    string subject = _localizer["EventCreatedEmailSubject"].Value;
                    string template = _localizer["EventCreatedEmailBody"].Value;
                    string mailBody = string.Format(template, organizer.FirstName, newEvent.Title, formattedDate, formattedTime);

                    await _emailService.SendEmailAsync(organizer.Email, subject, mailBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Etkinlik olu?turma e-postas? gönderilirken hata olu?tu. EventId: {EventId}, UserId: {UserId}", newEvent.Id, userId);
            }

            return _localizer["Res_Event_Created"].Value;
        }

        public async Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(GetAllEventsRequest request, Guid currentUserId)
        {
            await _getAllEventsValidator.ValidateAndThrowCustomAsync(request);

            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(
                request.PageNumber,
                request.PageSize,
                request.OnlyActive,
                request.SearchTerm,
                request.CategoryId,
                request.Status);

            var eventDetailResponses = _mapper.Map<List<EventDetailResponse>>(items);

            var eventIds = items.Select(i => i.Id).ToList();

            var joinedEventIds = await _eventRepository.GetJoinedEventIdsByUserAsync(eventIds, currentUserId);

            var joinedEventIdSet = joinedEventIds.ToHashSet();

            foreach (var response in eventDetailResponses)
            {
                var original = items.FirstOrDefault(i => i.Id == response.Id);
                if (original != null)
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

            var EventDetailResponse = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
            {
                EventDetailResponse.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";
                EventDetailResponse.Department = eventEntity.User.Department?.Name;
                EventDetailResponse.Grade = eventEntity.User.Grade;
            }

            EventDetailResponse.MapWithLocalization(eventEntity, _localizer);

            EventDetailResponse.IsCreator = (eventEntity.UserId == currentUserId);
            EventDetailResponse.IsJoined = await _eventRepository.IsUserJoinedEventAsync(eventId, currentUserId);

            return EventDetailResponse;
        }

        public async Task<EventDetailResponse?> GetMyActiveEventAsync(Guid userId)
        {
            var activeEvent = await _eventRepository.GetActiveEventByUserIdAsync(userId);

            if (activeEvent == null)
                return null;

            var eventDetailResponse = _mapper.Map<EventDetailResponse>(activeEvent);

            if (activeEvent.User != null)
            {
                eventDetailResponse.CreatorName = $"{activeEvent.User.FirstName} {activeEvent.User.LastName}";
                eventDetailResponse.Department = activeEvent.User.Department?.Name;
                eventDetailResponse.Grade = activeEvent.User.Grade;
            }

            eventDetailResponse.MapWithLocalization(activeEvent, _localizer);

            eventDetailResponse.IsCreator = true;

            return eventDetailResponse;
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

            if (eventEntity.EventDate <= DateTime.UtcNow)
                throw new BadRequestException(_localizer["Event_PastDate"].Value);

            if (eventEntity.UserId == userId)
                throw new BadRequestException(_localizer["Event_CannotJoinOwnEvent"].Value);

            var userWithDept = await _userRepository.GetUserWithDetailsByIdAsync(userId);
            if (userWithDept == null)
                throw new NotFoundException(_localizer["User_NotFound"].Value);

            if (!string.IsNullOrWhiteSpace(eventEntity.TargetFaculty) &&
                !string.Equals(userWithDept.Department?.Faculty?.Name, eventEntity.TargetFaculty, StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException(_localizer["Event_FacultyRestriction"].Value);
            }

            if (!string.IsNullOrWhiteSpace(eventEntity.TargetDepartment) &&
                !string.Equals(userWithDept.Department?.Name, eventEntity.TargetDepartment, StringComparison.OrdinalIgnoreCase))
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

            var alreadyJoined = await _eventRepository.IsUserJoinedEventAsync(eventId, userId);
            if (alreadyJoined)
                throw new ConflictException(_localizer["Event_AlreadyJoined"].Value);

            var attendee = new EventAttendee
            {
                EventId = eventId,
                UserId = userId
            };

            await _eventRepository.AddAttendeeAsync(attendee);
            await _unitOfWork.SaveChangesAsync();

            if (userWithDept != null && !string.IsNullOrEmpty(userWithDept.Email))
            {
                try
                {
                    var turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
                    var localEventTime = TimeZoneInfo.ConvertTimeFromUtc(eventEntity.EventDate, turkeyTimeZone);
                    var formattedDate = localEventTime.ToString("dd.MM.yyyy");
                    var formattedTime = localEventTime.ToString("HH:mm");

                    string subject = _localizer["EventJoinedEmailSubject"].Value;
                    string template = _localizer["EventJoinedEmailBody"].Value;

                    string mailBody = string.Format(template, userWithDept.FirstName, eventEntity.Title, formattedDate, formattedTime);

                    await _emailService.SendEmailAsync(userWithDept.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    throw new BadRequestException(_localizer["Auth_EmailSendFailed", ex.Message].Value);
                }
            }

            return _localizer["Res_Event_Joined"].Value;
        }

        public async Task<string> CancelEventAsync(Guid eventId, Guid userId, CancelEventRequest request)
        {
            await _cancelEventValidator.ValidateAndThrowCustomAsync(request);

            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

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

                var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);
                if (participants != null && participants.Any())
                {
                    foreach (var participant in participants)
                    {
                        if (!string.IsNullOrEmpty(participant.Email))
                        {
                            string participantSubject = _localizer["EventCancelledParticipantSubject"].Value;
                            string participantTemplate = _localizer["EventCancelledParticipantBody"].Value;
                            string participantBody = string.Format(participantTemplate, participant.FirstName, existingEvent.Title, request.Reason);

                            await _emailService.SendEmailAsync(participant.Email, participantSubject, participantBody);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new BadRequestException(_localizer["Auth_EmailSendFailed", ex.Message].Value);
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

            if (eventEntity.EventDate <= DateTime.UtcNow)
                throw new BadRequestException(_localizer["Event_CannotLeavePast"].Value);

            var attendee = await _eventRepository.GetAttendeeAsync(eventId, userId);
            if (attendee == null)
                throw new NotFoundException(_localizer["Event_NotJoined"].Value);

            var user = await _userRepository.GetUserWithDetailsByIdAsync(userId);

            _eventRepository.RemoveAttendee(attendee);
            await _unitOfWork.SaveChangesAsync();

            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                try
                {
                    string subject = _localizer["EventLeftEmailSubject"].Value;
                    string template = _localizer["EventLeftEmailBody"].Value;

                    string mailBody = string.Format(template, user.FirstName, eventEntity.Title);

                    await _emailService.SendEmailAsync(user.Email, subject, mailBody);
                }
                catch (Exception ex)
                {
                    throw new BadRequestException(_localizer["Auth_EmailSendFailed", ex.Message].Value);
                }
            }

            return _localizer["Res_Event_LeftSuccessfully"].Value;
        }
    }
}