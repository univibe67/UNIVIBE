using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            this._eventService = eventService;
        }

        [HttpGet("all-events")]
        public async Task<IActionResult> GetAllEvents([FromQuery] GetAllEventsRequest request)
        {
            var pagedEvents = await _eventService.GetAllEventsAsync(
                request.PageNumber,
                request.PageSize,
                request.OnlyActive
            );

            return Ok(ApiResponse<object>.Success(pagedEvents));
        }

        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventDto createEventDto)
        {

            var userId = User.GetUserId();

            await _eventService.CreateEventAsync(createEventDto, userId);

            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla oluşturuldu."));
        }

        [HttpDelete("delete-event/{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var userId = User.GetUserId();

            await _eventService.DeleteEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla silindi."));
        }
    }
}
