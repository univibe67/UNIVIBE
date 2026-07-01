using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Constants;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            this._eventService = eventService;
        }

        [HttpGet("all-events")]
        public async Task<IActionResult> GetAllEvents(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool onlyActive = true)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 50) pageSize = 50;
            // Gelen onlyActive değerini servise iletiyoruz
            var pagedEvents = await _eventService.GetAllEventsAsync(pageNumber, pageSize, onlyActive);

            if (pagedEvents.Items == null || pagedEvents.Items.Count == 0)
            {
                return NoContent();
            }

            return Ok(pagedEvents);
        }

        [Authorize]
        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto createEventDto)
        {

            var userId = User.GetUserId();

            await _eventService.CreateEventAsync(createEventDto, userId);

            return Ok(new { Message = "Etkinlik başarıyla oluşturuldu." });
        }

        [Authorize]
        [HttpDelete("delete-event/{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var userId = User.GetUserId();

            await _eventService.DeleteEventAsync(id, userId);

            return Ok(new { Message = "Etkinlik başarıyla silindi." });
        }
    }
}
