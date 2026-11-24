using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.DTOs.Message.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/events")]
    [ApiController]
    [Authorize]
    public sealed class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IEventMessageService _eventMessageService;
        private readonly IHubContext<EventChatHub> _hubContext;

        public EventsController(IEventService eventService, IEventMessageService eventMessageService, IHubContext<EventChatHub> hubContext)
        {
            _eventService = eventService;
            _eventMessageService = eventMessageService;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] GetAllEventsRequest request)
        {
            var currentUserId = User.GetUserId();
            var isAdmin = User.IsInRole("Admin");

            var pagedEvents = await _eventService.GetAllEventsAsync(request, currentUserId, isAdmin);
            return Ok(ApiResponse<PaginatedResult<EventDetailResponse>>.Success(pagedEvents));
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CreateEventAsync(request, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("active/me")]
        public async Task<IActionResult> GetMyActiveEvent()
        {
            var userId = User.GetUserId();
            var myEvent = await _eventService.GetMyActiveEventAsync(userId);

            return Ok(ApiResponse<List<EventDetailResponse>>.Success(myEvent));
        }

        [HttpGet("joined/me")]
        public async Task<IActionResult> GetMyJoinedEvents()
        {
            var userId = User.GetUserId();
            var joinedEvents = await _eventService.GetMyJoinedEventsAsync(userId);

            return Ok(ApiResponse<List<EventDetailResponse>>.Success(joinedEvents));
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetEventStatistics()
        {
            var statistics = await _eventService.GetEventStatisticsAsync();
            return Ok(ApiResponse<EventStatisticsResponse>.Success(statistics));
        }

        [HttpPatch("{id:guid}/cancel")]
        public async Task<IActionResult> CancelEvent(Guid id, [FromBody] CancelEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CancelEventAsync(id, userId, request);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPost("{id:guid}/attendees")]
        public async Task<IActionResult> JoinEvent(Guid id)
        {
            var userId = User.GetUserId();
            var message = await _eventService.JoinEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var currentUserId = User.GetUserId();
            var eventData = await _eventService.GetEventByIdAsync(id, currentUserId);

            return Ok(ApiResponse<EventDetailResponse>.Success(eventData));
        }

        [HttpGet("{id:guid}/participants")]
        public async Task<IActionResult> GetEventParticipants(Guid id)
        {
            var participants = await _eventService.GetEventParticipantsAsync(id);

            return Ok(ApiResponse<List<ParticipantResponse>>.Success(participants));
        }

        [HttpDelete("{id:guid}/attendees/me")]
        public async Task<IActionResult> LeaveEvent(Guid id)
        {
            var userId = User.GetUserId();
            var message = await _eventService.LeaveEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("{id:guid}/messages")]
        public async Task<IActionResult> GetEventMessages(
            Guid id,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = User.GetUserId();
            var messages = await _eventMessageService.GetMessagesAsync(id, userId, pageNumber, pageSize);

            return Ok(ApiResponse<List<EventMessageResponse>>.Success(messages));
        }
        [HttpPost("{id:guid}/messages")]
        public async Task<IActionResult> SendEventMessage(Guid id, [FromBody] SendMessageRequest request)
        {
            var userId = User.GetUserId();
            var createdMessage = await _eventMessageService.SendMessageAsync(id, userId, request);

            await _hubContext.Clients.Group(id.ToString())
                .SendAsync("ReceiveMessage", createdMessage);

            return Ok(ApiResponse<EventMessageResponse>.Success(createdMessage));
        }
    }
}