using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        public AdminEventController(IAdminEventService adminEventService)
        {
            _adminEventService = adminEventService;
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
            var message = await _adminEventService.ApproveEventAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPut("reject/{id}")]
        public async Task<IActionResult> RejectEvent(Guid id, [FromBody] RejectEventRequest request)
        {
            var message = await _adminEventService.RejectEventAsync(id, request.Reason);
            return Ok(ApiResponse<string>.Success(message));
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
            var eventDetails = await _adminEventService.GetEventDetailsByIdAsync(id);
            return Ok(ApiResponse<EventDetailResponse>.Success(eventDetails));
        }
    }
}