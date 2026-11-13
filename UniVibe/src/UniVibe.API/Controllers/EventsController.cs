using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/events")]
    [ApiController]
    [Authorize]
    public sealed class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] GetAllEventsRequest request)
        {
            var currentUserId = User.GetUserId();
            var pagedEvents = await _eventService.GetAllEventsAsync(request, currentUserId);
            return Ok(ApiResponse<PaginatedResult<EventDetailResponse>>.Success(pagedEvents));
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CreateEventAsync(request, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelEvent(Guid id, [FromBody] CancelEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CancelEventAsync(id, userId, request);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("active/me")]
        public async Task<IActionResult> GetMyActiveEvent()
        {
            var userId = User.GetUserId();
            var myEvent = await _eventService.GetMyActiveEventAsync(userId);

            return Ok(ApiResponse<EventDetailResponse?>.Success(myEvent));
        }

        [HttpGet("joined/me")]
        public async Task<IActionResult> GetMyJoinedEvents()
        {
            var userId = User.GetUserId();
            var joinedEvents = await _eventService.GetMyJoinedEventsAsync(userId);

            return Ok(ApiResponse<List<EventDetailResponse>>.Success(joinedEvents));
        }

        [HttpPost("{id}/attendees")]
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

        [HttpGet("statistics")]
        public async Task<IActionResult> GetEventStatistics()
        {
            var statistics = await _eventService.GetEventStatisticsAsync();
            return Ok(ApiResponse<EventStatisticsResponse>.Success(statistics));
        }

        [HttpDelete("{id}/attendees/me")]
        public async Task<IActionResult> LeaveEvent(Guid id)
        {
            var userId = User.GetUserId();
            var message = await _eventService.LeaveEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success(message));
        }
    }
}