using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Services;

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
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _eventService.GetAllEventsAsync();

            if (events == null || events.Count == 0)
            {
                return NoContent();
            }

            return Ok(events);
        }

        [Authorize]
        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto createEventDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("Kullanıcı kimliği bulunamadı.");

            var userId = Guid.Parse(userIdClaim);

            await _eventService.CreateEventAsync(createEventDto, userId);

            return Ok(new { Message = "Etkinlik başarıyla oluşturuldu." });
        }
    }
}
