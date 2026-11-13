using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Feedback.Request;
using UniVibe.Application.DTOs.Feedback.Response;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/feedbacks")]
    [ApiController]
    public sealed class FeedbacksController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbacksController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            var userId = User.GetUserId();

            var message = await _feedbackService.CreateFeedbackAsync(userId, dto);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var feedbacks = await _feedbackService.GetAllFeedbacksAsync();
            return Ok(ApiResponse<List<FeedbackResponseDto>>.Success(feedbacks));
        }

        [HttpPatch("{id}/resolution")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Resolve(Guid id)
        {
            var message = await _feedbackService.ResolveFeedbackAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}