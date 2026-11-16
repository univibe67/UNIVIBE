using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Hubs
{
    [Authorize]
    public sealed class EventChatHub : Hub
    {
        private readonly IEventMessageService _eventMessageService;

        public EventChatHub(IEventMessageService eventMessageService)
        {
            _eventMessageService = eventMessageService;
        }

        public async Task JoinEventGroup(string eventId)
        {
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
                var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                   ?? Context.User?.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    await Clients.Caller.SendAsync("OnError", "Yetkilendirme hatası: Kullanıcı kimliği bulunamadı.");
                    return;
                }

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
    }
}