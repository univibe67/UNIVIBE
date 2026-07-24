using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public sealed class EventCategoriesController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventCategoriesController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet("event-categories")]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _eventService.GetCategoriesAsync();
            return Ok(ApiResponse<List<EventCategoryResponse>>.Success(categories));
        }
    }
}