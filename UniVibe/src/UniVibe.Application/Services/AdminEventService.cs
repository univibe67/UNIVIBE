using AutoMapper;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminEventService : IAdminEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public AdminEventService(IEventRepository eventRepository, IUnitOfWork unitOfWork, IMapper mapper, IStringLocalizer<SharedResources> localizer)
        {
            _eventRepository = eventRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
        }

        public async Task<List<EventListResponse>> GetPendingEventsAsync()
        {
            var pendingEvents = await _eventRepository.GetAllAsync(e => e.Status == EventStatus.Pending);

            return _mapper.Map<List<EventListResponse>>(pendingEvents.OrderByDescending(e => e.CreatedAt)).ToList();
        }

        public async Task<List<EventListResponse>> GetAllEventsAsync()
        {
            var allEvents = await _eventRepository.GetAllWithUsersAsync();

            return _mapper.Map<List<EventListResponse>>(allEvents.OrderByDescending(e => e.CreatedAt)).ToList();
        }

        public async Task<string> ApproveEventAsync(Guid eventId)
        {
            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId);

            if (evnt == null)
                throw new Exception(_localizer["Res_Event_NotFound"].Value);

            evnt.Status = EventStatus.Approved;

            _eventRepository.Update(evnt);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Approved"].Value;
        }

        public async Task<string> RejectEventAsync(Guid eventId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new Exception(_localizer["Res_Event_ReasonRequired"].Value);

            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId);

            if (evnt == null)
                throw new Exception(_localizer["Res_Event_NotFound"].Value);

            evnt.Status = EventStatus.Rejected;
            evnt.RejectionReason = reason;

            _eventRepository.Update(evnt);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Rejected"].Value;
        }

        public async Task<EventDetailResponse> GetEventDetailsByIdAsync(Guid eventId)
        {
            var eventEntity = await _eventRepository.GetEventWithDetailsByIdAsync(eventId);

            if (eventEntity == null)
                throw new Exception(_localizer["Event_NotFound"].Value);

            var eventDetailResponse = _mapper.Map<EventDetailResponse>(eventEntity);

            if (eventEntity.User != null)
                eventDetailResponse.CreatorName = $"{eventEntity.User.FirstName} {eventEntity.User.LastName}";

            if (eventEntity.Category != null)
                eventDetailResponse.CategoryName = eventEntity.Category.Name;

            eventDetailResponse.RejectionReason = eventEntity.RejectionReason;
            eventDetailResponse.CancellationReason = eventEntity.CancellationReason;
            eventDetailResponse.IsDeleted = eventEntity.IsDeleted;
            eventDetailResponse.IsCreator = false;

            return eventDetailResponse;
        }
    }
}