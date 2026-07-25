using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEventCategoryRepository _categoryRepository;
        private readonly IImageService _imageService;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly IValidator<CreateEventRequest> _createEventValidator;
        private readonly IValidator<GetAllEventsRequest> _getAllEventsValidator;

        public EventService(
            IEventRepository eventRepository,
            IEventCategoryRepository categoryRepository,
            IImageService imageService,
            IMapper mapper,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            IValidator<CreateEventRequest> createEventValidator,
            IValidator<GetAllEventsRequest> getAllEventsValidator)
        {
            _eventRepository = eventRepository;
            _categoryRepository = categoryRepository;
            _imageService = imageService;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _createEventValidator = createEventValidator;
            _getAllEventsValidator = getAllEventsValidator;
        }

        public async Task<string> CreateEventAsync(CreateEventRequest request, Guid userId)
        {
            var validationResult = await _createEventValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new Exception(string.Join(" • ", errors));
            }

            var hasActiveEvent = await _eventRepository.AnyAsync(e =>
                e.UserId == userId &&
                e.EventDate > DateTime.UtcNow &&
                e.IsDeleted == false &&
                e.Status != EventStatus.Cancelled &&
                e.Status != EventStatus.Rejected);

            if (hasActiveEvent)
                throw new Exception(_localizer["Event_HasActiveEvent"].Value);

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == request.CategoryId);
            if (!categoryExists)
                throw new Exception(_localizer["Event_CategoryNotFound"].Value);

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

        public async Task<PaginatedResult<EventDetailResponse>> GetAllEventsAsync(GetAllEventsRequest request)
        {
            var validationResult = await _getAllEventsValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new Exception(string.Join(" • ", errors));
            }

            var (items, totalCount) = await _eventRepository.GetPagedEventsAsync(request.PageNumber, request.PageSize, request.OnlyActive);

            var EventDetailResponses = _mapper.Map<List<EventDetailResponse>>(items);

            return new PaginatedResult<EventDetailResponse>
            {
                Items = EventDetailResponses,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        public async Task<List<EventCategoryResponse>> GetCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            return _mapper.Map<List<EventCategoryResponse>>(categories);
        }

        public async Task<EventDetailResponse> GetEventByIdAsync(Guid eventId, Guid currentUserId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);

            if (eventEntity == null)
                throw new Exception(_localizer["Event_NotFound"].Value);

            var EventDetailResponse = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
                EventDetailResponse.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";

            if (eventEntity.Category != null)
                EventDetailResponse.CategoryName = eventEntity.Category.Name;

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

            if (activeEvent.Category != null)
                eventDetailResponse.CategoryName = activeEvent.Category.Name;

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

                if (eventEntity.User != null)
                    response.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";

                if (eventEntity.Category != null)
                    response.CategoryName = eventEntity.Category.Name;

                response.IsCreator = (eventEntity.UserId == userId);
            }

            return eventDetailResponses;
        }

        public async Task<string> JoinEventAsync(Guid eventId, Guid userId)
        {
            var eventEntity = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
            if (eventEntity == null)
                throw new Exception(_localizer["Event_NotFound"].Value);

            if (eventEntity.UserId == userId)
                throw new Exception(_localizer["Event_CannotJoinOwnEvent"].Value);

            var alreadyJoined = await _eventRepository.IsUserJoinedEventAsync(eventId, userId);
            if (alreadyJoined)
                throw new Exception(_localizer["Event_AlreadyJoined"].Value);

            var attendee = new EventAttendee
            {
                EventId = eventId,
                UserId = userId
            };

            await _eventRepository.AddAttendeeAsync(attendee);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Joined"].Value;
        }

        public async Task<string> CancelEventAsync(Guid eventId, Guid userId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new Exception(_localizer["Res_Event_ReasonRequired"].Value);

            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if (existingEvent == null)
                throw new Exception(_localizer["Event_NotFound"].Value);

            if (existingEvent.UserId != userId)
                throw new Exception(_localizer["Event_UnauthorizedCancel"].Value);

            var timeDifference = existingEvent.EventDate - DateTime.UtcNow;

            if (timeDifference.TotalHours < 0)
                throw new Exception(_localizer["Event_CannotCancelPast"].Value);

            if (timeDifference.TotalHours < 4)
                throw new Exception(_localizer["Event_CannotCancelClose"].Value);

            if (existingEvent.Status == EventStatus.Cancelled)
                throw new Exception(_localizer["Event_AlreadyCancelled"].Value);

            existingEvent.Status = EventStatus.Cancelled;
            existingEvent.CancellationReason = reason;
            existingEvent.UpdatedAt = DateTime.UtcNow;

            _eventRepository.Update(existingEvent);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Cancelled"].Value;
        }
        public async Task<List<ParticipantResponse>> GetEventParticipantsAsync(Guid eventId)
        {
            var eventExists = await _eventRepository.AnyAsync(e => e.Id == eventId && !e.IsDeleted);

            if (!eventExists)
                throw new Exception(_localizer["Event_NotFound"].Value);

            var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);

            if (participants == null || !participants.Any())
                return new List<ParticipantResponse>();

            return _mapper.Map<List<ParticipantResponse>>(participants);
        }
    }
}