using AutoMapper;
using Microsoft.Extensions.Localization;
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
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public AdminEventService(
            IEventRepository eventRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStringLocalizer<SharedResources> localizer)
        {
            _eventRepository = eventRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
        }

        public async Task<List<EventListResponse>> GetPendingEventsAsync()
        {
            var pendingEvents = await _eventRepository.GetEventsWithUsersByStatusAsync(EventStatus.Pending);
            var response = _mapper.Map<List<EventListResponse>>(pendingEvents);
            response.MapListWithLocalization(pendingEvents, _localizer);
            return response;
        }

        public async Task<List<EventListResponse>> GetAllEventsAsync()
        {
            var allEvents = await _eventRepository.GetEventsWithUsersByStatusAsync();
            var response = _mapper.Map<List<EventListResponse>>(allEvents);
            response.MapListWithLocalization(allEvents, _localizer);
            return response;
        }

        public async Task<string> ApproveEventAsync(Guid eventId)
        {
            var evnt = await GetEventOrThrowAsync(eventId);

            ValidateEventForApproval(evnt);

            evnt.Status = EventStatus.Approved;
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Event_Approved"].Value;
        }

        public async Task<string> RejectEventAsync(Guid eventId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new BadRequestException(_localizer["Res_Event_ReasonRequired"].Value);

            var evnt = await GetEventOrThrowAsync(eventId);

            evnt.Status = EventStatus.Rejected;
            evnt.RejectionReason = reason;

            await _unitOfWork.SaveChangesAsync();

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
            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
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