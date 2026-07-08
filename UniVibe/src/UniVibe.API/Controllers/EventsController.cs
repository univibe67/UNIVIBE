using FluentValidation;
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
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IValidator<GetAllEventsRequest> _getAllEventsValidator;
        private readonly IValidator<CreateEventRequest> _createEventValidator;

        public EventsController(IEventService eventService, IValidator<CreateEventRequest> createEventValidator, IValidator<GetAllEventsRequest> getAllEventsValidator)
        {
            this._eventService = eventService;
            _createEventValidator = createEventValidator;
            _getAllEventsValidator = getAllEventsValidator;
        }

        [HttpGet("all-events")]
        public async Task<IActionResult> GetAllEvents([FromQuery] GetAllEventsRequest request)
        {
            var validationResult = await _getAllEventsValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { isSuccessful = false, errors = errors });
            }

            var pagedEvents = await _eventService.GetAllEventsAsync(
                request.PageNumber,
                request.PageSize,
                request.OnlyActive
            );

            return Ok(ApiResponse<object>.Success(pagedEvents));
        }

        [HttpPost("create-event")]
        public async Task<IActionResult> CreateEvent([FromForm] CreateEventRequest createEventDetailResponse)
        {
            var validationResult = await _createEventValidator.ValidateAsync(createEventDetailResponse);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { isSuccessful = false, errors = errors });
            }

            var userId = User.GetUserId();
            await _eventService.CreateEventAsync(createEventDetailResponse, userId);
            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla oluşturuldu."));
        }

        [HttpDelete("delete-event/{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var userId = User.GetUserId();

            await _eventService.DeleteEventAsync(id, userId);

            return Ok(ApiResponse<string>.Success("Etkinlik başarıyla silindi."));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var currentUserId = User.GetUserId();

            var eventData = await _eventService.GetEventByIdAsync(id, currentUserId);
            return Ok(ApiResponse<object>.Success(eventData));
        }

        [HttpGet("my-active-event")]
        public async Task<IActionResult> GetMyActiveEvent()
        {
            var userId = User.GetUserId();
            var myEvent = await _eventService.GetMyActiveEventAsync(userId);

            return Ok(ApiResponse<object>.Success(myEvent));
        }
    }
}
