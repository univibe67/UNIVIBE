using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Feedback.Request;
using UniVibe.Application.DTOs.Feedback.Response;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public sealed class FeedbacksController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbacksController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpPost]
        [Authorize] // Normal veya admin giriş yapmış kullanıcı feedback atabilir (Günde max 2)
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var message = await _feedbackService.CreateFeedbackAsync(userId, dto);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet]
        [Authorize(Roles = "Admin")] // Sadece adminler tüm listeyi ve kullanıcı detaylarını görebilir
        public async Task<IActionResult> GetAll()
        {
            var feedbacks = await _feedbackService.GetAllFeedbacksAsync();
            return Ok(ApiResponse<List<FeedbackResponseDto>>.Success(feedbacks));
        }

        [HttpPatch("{id}/resolve")]
        [Authorize(Roles = "Admin")] // Sadece adminler çözüldü olarak işaretleyebilir
        public async Task<IActionResult> Resolve(Guid id)
        {
            var message = await _feedbackService.ResolveFeedbackAsync(id);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}
