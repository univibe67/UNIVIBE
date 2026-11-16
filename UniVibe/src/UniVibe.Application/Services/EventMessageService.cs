using AutoMapper;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.DTOs.Message.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public sealed class EventMessageService : IEventMessageService
    {
        private readonly IEventMessageRepository _eventMessageRepository;
        private readonly IEventRepository _eventRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public EventMessageService(
            IEventMessageRepository eventMessageRepository,
            IEventRepository eventRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStringLocalizer<SharedResources> localizer)
        {
            _eventMessageRepository = eventMessageRepository;
            _eventRepository = eventRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
        }

        public async Task<EventMessageResponse> SendMessageAsync(Guid eventId, Guid userId, SendMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                throw new BadRequestException(_localizer["Event_MessageEmpty"].Value);

            var eventEntity = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            bool isCreator = (eventEntity.UserId == userId);
            bool isAttendee = await _eventRepository.IsUserJoinedEventAsync(eventId, userId);

            if (!isCreator && !isAttendee)
            {
                throw new ForbiddenException(_localizer["Event_ChatAccessDenied"].Value);
            }

            var message = new EventMessage
            {
                EventId = eventId,
                UserId = userId,
                Content = request.Content.Trim()
            };

            await _eventMessageRepository.AddAsync(message);
            await _unitOfWork.SaveChangesAsync();

            var savedMessageWithUser = await _eventMessageRepository.GetByIdWithUserAsync(message.Id);

            var response = _mapper.Map<EventMessageResponse>(savedMessageWithUser);

            return response;
        }

        public async Task<List<EventMessageResponse>> GetMessagesAsync(Guid eventId, Guid userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;

            var eventEntity = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
            if (eventEntity == null)
                throw new NotFoundException(_localizer["Event_NotFound"].Value);

            bool isCreator = (eventEntity.UserId == userId);
            bool isAttendee = await _eventRepository.IsUserJoinedEventAsync(eventId, userId);

            if (!isCreator && !isAttendee)
            {
                throw new ForbiddenException(_localizer["Event_ChatAccessDenied"].Value);
            }

            var messages = await _eventMessageRepository.GetMessagesByEventIdAsync(eventId, pageNumber, pageSize);

            return _mapper.Map<List<EventMessageResponse>>(messages);
        }
    }
}