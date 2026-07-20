using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
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
        private readonly IStringLocalizer<SharedResources> _localization;

        public AdminEventController(IAdminEventService adminEventService, IStringLocalizer<SharedResources> sharedResources)
        {
            _adminEventService = adminEventService;
            _localization = sharedResources;
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
                return NotFound(ApiResponse<string>.Fail(_localization["Res_Event_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_localization["Res_Event_Approved"].Value));
        }

        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectEvent(Guid id, [FromBody] RejectEventRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
                return BadRequest(ApiResponse<string>.Fail(_localization["Res_Event_ReasonRequired"].Value));
            var result = await _adminEventService.RejectEventAsync(id, request.Reason);

            if (!result)
                return NotFound(ApiResponse<string>.Fail(_localization["Res_Event_NotFound"].Value));

            return Ok(ApiResponse<string>.Success(_localization["Res_Event_Rejected"].Value));
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _adminEventService.GetAllEventsAsync();
            return Ok(ApiResponse<List<EventListResponse>>.Success(events));
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventDetails(Guid id)
        {
            try
            {
                var eventDetails = await _adminEventService.GetEventDetailsByIdAsync(id);
                return Ok(ApiResponse<EventDetailResponse>.Success(eventDetails));
            }
            catch (Exception ex)
            {
                return NotFound(ApiResponse<string>.Fail(ex.Message));
            }
        }
    }
}