using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminEventController : ControllerBase
    {
        private readonly IAdminEventService _adminEventService;
        private readonly IStringLocalizer<SharedResources> _sharedResources;

        public AdminEventController(IAdminEventService adminEventService, IStringLocalizer<SharedResources> sharedResources)
        {
            _adminEventService = adminEventService;
            _sharedResources = sharedResources;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents()
        {
            var events = await _adminEventService.GetPendingEventsAsync();

            return Ok(ApiResponse<List<EventListResponse>>.Success(events));
        }

        [HttpPut("approve/{id}")]
        public async Task<IActionResult> ApproveEvent(Guid id)
        {
            var result = await _adminEventService.ApproveEventAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_Event_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_Event_Approved"].Value));
        }

        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectEvent(Guid id)
        {
            var result = await _adminEventService.RejectEventAsync(id);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_sharedResources["Res_Event_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_sharedResources["Res_Event_Rejected"].Value));
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _adminEventService.GetAllEventsAsync();
            return Ok(ApiResponse<List<EventListResponse>>.Success(events));
        }
    }
}