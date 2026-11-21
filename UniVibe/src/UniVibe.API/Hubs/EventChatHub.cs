using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.API.Hubs
{
    [Authorize]
    public sealed class EventChatHub : Hub
    {
        private readonly IEventMessageService _eventMessageService;
        private readonly IEventRepository _eventRepository;

        public EventChatHub(
            IEventMessageService eventMessageService,
            IEventRepository eventRepository)
        {
            _eventMessageService = eventMessageService;
            _eventRepository = eventRepository;
        }

        public async Task JoinEventGroup(string eventId)
        {
            var userId = GetCurrentUserIdOrThrow();

            if (!Guid.TryParse(eventId, out var parsedEventId))
            {
                throw new HubException("Geçersiz etkinlik ID formatı.");
            }

            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == parsedEventId && !e.IsDeleted);
            if (evnt == null)
            {
                throw new HubException("Etkinlik bulunamadı.");
            }

            if (evnt.Status != EventStatus.Approved || !evnt.IsActive)
            {
                throw new HubException("Sadece aktif ve onaylı etkinliklerin sohbet odasına katılabilirsiniz.");
            }

            bool isOrganizer = evnt.UserId == userId;
            bool isParticipant = await _eventRepository.IsUserJoinedEventAsync(parsedEventId, userId);

            if (!isOrganizer && !isParticipant)
            {
                throw new HubException("Bu etkinliğin sohbet odasına katılma yetkiniz yok.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, eventId);
        }

        public async Task LeaveEventGroup(string eventId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, eventId);
        }

        public async Task SendMessage(string eventId, string content)
        {
            try
            {
                var userId = GetCurrentUserIdOrThrow();

                if (!Guid.TryParse(eventId, out var parsedEventId))
                {
                    await Clients.Caller.SendAsync("OnError", "Geçersiz etkinlik ID formatı.");
                    return;
                }

                var request = new SendMessageRequest(content);

                var createdMessage = await _eventMessageService.SendMessageAsync(parsedEventId, userId, request);

                await Clients.Group(eventId).SendAsync("ReceiveMessage", createdMessage);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("OnError", ex.Message);
            }
        }

        private Guid GetCurrentUserIdOrThrow()
        {
            if (Context.User == null)
                throw new HubException("Yetkilendirme hatası: Kullanıcı kimliği bulunamadı.");

            try
            {
                return Context.User.GetUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new HubException(ex.Message);
            }
        }
    }
}