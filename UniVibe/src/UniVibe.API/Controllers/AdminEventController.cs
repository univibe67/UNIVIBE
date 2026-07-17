using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.Interfaces;
using UniVibe.Domain.Entities;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminEventController : ControllerBase
    {
        private readonly IAdminEventService _adminEventService;

        public AdminEventController(IAdminEventService adminEventService)
        {
            _adminEventService = adminEventService;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents()
        {
            var events = await _adminEventService.GetPendingEventsAsync();

            return Ok(ApiResponse<List<Event>>.Success(events));
        }

        [HttpPut("approve/{id}")]
        public async Task<IActionResult> ApproveEvent(Guid id)
        {
            var result = await _adminEventService.ApproveEventAsync(id);

            if (!result)
                return NotFound(new { isSuccessful = false, errors = new[] { "Onaylanacak etkinlik bulunamadı." } });

            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla onaylandı ve yayına alındı!"));
        }

        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectEvent(Guid id)
        {
            var result = await _adminEventService.RejectEventAsync(id);

            if (!result)
                return NotFound(new { isSuccessful = false, errors = new[] { "Reddedilecek etkinlik bulunamadı." } });

            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla reddedildi!"));
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _adminEventService.GetAllEventsAsync();
            return Ok(ApiResponse<List<Event>>.Success(events));
        }
    }
}