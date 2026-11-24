using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/admin/events")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminEventController : ControllerBase
    {
        private readonly IAdminEventService _adminEventService;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public AdminEventController(
            IAdminEventService adminEventService,
            IStringLocalizer<SharedResources> localizer)
        {
            _adminEventService = adminEventService;
            _localizer = localizer;
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingEvents([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var events = await _adminEventService.GetPendingEventsAsync(pageNumber, pageSize);
            return Ok(ApiResponse<PaginatedResult<EventListResponse>>.Success(events));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var events = await _adminEventService.GetAllEventsAsync(pageNumber, pageSize);
            return Ok(ApiResponse<PaginatedResult<EventListResponse>>.Success(events));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEventDetails(Guid id)
        {
            var eventDetails = await _adminEventService.GetEventDetailsByIdAsync(id);
            return Ok(ApiResponse<EventDetailResponse>.Success(eventDetails));
        }

        [HttpPatch("{id:guid}/approval")]
        public async Task<IActionResult> ApproveEvent(Guid id)
        {
            var message = await _adminEventService.ApproveEventAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPatch("{id:guid}/rejection")]
        public async Task<IActionResult> RejectEvent(Guid id, [FromBody] RejectEventRequest? request)
        {
            if (request is null)
                throw new BadRequestException(_localizer["Admin_Event_RejectBodyRequired"].Value);

            var message = await _adminEventService.RejectEventAsync(id, request.Reason);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}