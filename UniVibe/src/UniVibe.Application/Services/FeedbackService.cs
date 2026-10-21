using AutoMapper;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Feedback.Request;
using UniVibe.Application.DTOs.Feedback.Response;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{

    public sealed class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public FeedbackService(
            IFeedbackRepository feedbackRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStringLocalizer<SharedResources> localizer)
        {
            _feedbackRepository = feedbackRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _localizer = localizer;
        }

        public async Task<List<FeedbackResponseDto>> GetAllFeedbacksAsync()
        {
            var feedbacks = await _feedbackRepository.GetAllFeedbacksWithUserAsync();
            return _mapper.Map<List<FeedbackResponseDto>>(feedbacks);
        }

        public async Task<string> CreateFeedbackAsync(Guid userId, CreateFeedbackDto dto)
        {
            // Günlük max 2 limit kontrolü
            var todayCount = await _feedbackRepository.GetTodayFeedbackCountByUserIdAsync(userId);
            if (todayCount >= 2)
                throw new BadRequestException(_localizer["Res_Feedback_DailyLimitExceeded"].Value);

            var feedback = new Feedback
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Subject = dto.Subject,
                Message = dto.Message,
                IsResolved = false,
                CreatedAt = DateTime.UtcNow
            };

            await _feedbackRepository.AddAsync(feedback);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Feedback_Created"].Value;
        }

        public async Task<string> ResolveFeedbackAsync(Guid feedbackId)
        {
            var feedback = await _feedbackRepository.GetFeedbackWithUserByIdAsync(feedbackId);

            if (feedback == null)
                throw new NotFoundException(_localizer["Res_Feedback_NotFound"].Value);

            feedback.IsResolved = true;
            feedback.UpdatedAt = DateTime.UtcNow;

            _feedbackRepository.Update(feedback);
            await _unitOfWork.SaveChangesAsync();

            return _localizer["Res_Feedback_Resolved"].Value;
        }
    }
}