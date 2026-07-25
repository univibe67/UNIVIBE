using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public sealed class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet("all-events")]
        public async Task<IActionResult> GetAllEvents([FromQuery] GetAllEventsRequest request)
        {
            var pagedEvents = await _eventService.GetAllEventsAsync(request);
            return Ok(ApiResponse<PaginatedResult<EventDetailResponse>>.Success(pagedEvents));
        }

        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CreateEventAsync(request, userId);

            return Ok(ApiResponse<string>.Success(message));
        }
        [HttpPost("cancel-event/{id}")]
        public async Task<IActionResult> CancelEvent(Guid id, [FromBody] string reason)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CancelEventAsync(id, userId, reason);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("my-active-event")]
        public async Task<IActionResult> GetMyActiveEvent()
        {
            var userId = User.GetUserId();
            var myEvent = await _eventService.GetMyActiveEventAsync(userId);

            return Ok(ApiResponse<EventDetailResponse?>.Success(myEvent));
        }

        [HttpGet("my-joined-events")]
        public async Task<IActionResult> GetMyJoinedEvents()
        {
            var userId = User.GetUserId();
            var joinedEvents = await _eventService.GetMyJoinedEventsAsync(userId);

            return Ok(ApiResponse<List<EventDetailResponse>>.Success(joinedEvents));
        }

        [HttpPost("join/{id}")]
        public async Task<IActionResult> JoinEvent(Guid id)
        {
            var userId = User.GetUserId();
            var message = await _eventService.JoinEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var currentUserId = User.GetUserId();
            var eventData = await _eventService.GetEventByIdAsync(id, currentUserId);

            return Ok(ApiResponse<EventDetailResponse>.Success(eventData));
        }

        [HttpGet("{id}/participants")]
        public async Task<IActionResult> GetEventParticipants(Guid id)
        {
            var participants = await _eventService.GetEventParticipantsAsync(id);

            return Ok(ApiResponse<List<ParticipantResponse>>.Success(participants));
        }
    }
}