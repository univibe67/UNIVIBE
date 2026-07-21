using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
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
            return Ok(ApiResponse<object>.Success(pagedEvents));
        }

        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventRequest request)
        {
            var userId = User.GetUserId();
            var message = await _eventService.CreateEventAsync(request, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpDelete("delete-event/{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var userId = User.GetUserId();
            var message = await _eventService.DeleteEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("my-active-event")]
        public async Task<IActionResult> GetMyActiveEvent()
        {
            var userId = User.GetUserId();
            var myEvent = await _eventService.GetMyActiveEventAsync(userId);

            return Ok(ApiResponse<object>.Success(myEvent));
        }

        [HttpGet("my-joined-events")]
        public async Task<IActionResult> GetMyJoinedEvents()
        {
            var userId = User.GetUserId();
            var joinedEvents = await _eventService.GetMyJoinedEventsAsync(userId);

            return Ok(ApiResponse<object>.Success(joinedEvents));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var currentUserId = User.GetUserId();
            var eventData = await _eventService.GetEventByIdAsync(id, currentUserId);

            return Ok(ApiResponse<object>.Success(eventData));
        }
    }
}