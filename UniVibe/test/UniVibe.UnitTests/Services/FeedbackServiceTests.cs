using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Feedback.Request;
using UniVibe.Application.DTOs.Feedback.Response;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using Xunit;

namespace UniVibe.UnitTests.Services
{
    public class FeedbackServiceTests
    {
        private readonly Mock<IFeedbackRepository> _feedbackRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;
        private readonly IValidator<CreateFeedbackDto> _createValidator; // Mock yerine gerçek/inline validator

        private readonly FeedbackService _feedbackService;

        public FeedbackServiceTests()
        {
            _feedbackRepoMock = new Mock<IFeedbackRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();

            // 💡 ÇÖZÜM: Mock yerine FluentValidation'ın InlineValidator nesnesini kullanıyoruz.
            // Bu sayede ValidateAndThrowCustomAsync extension metodu patlamadan sorunsuz çalışır.
            _createValidator = new InlineValidator<CreateFeedbackDto>();

            _feedbackService = new FeedbackService(
                _feedbackRepoMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _localizerMock.Object,
                _createValidator
            );
        }

        // ==========================================
        // 1. TESTS FOR GetAllFeedbacksAsync
        // ==========================================
        [Fact]
        public async Task GetAllFeedbacksAsync_ShouldReturnListOfFeedbackResponseDtos()
        {
            // Arrange
            var feedbacks = new List<Feedback>
            {
                new Feedback { Id = Guid.NewGuid(), Subject = "Test 1", Message = "Msg 1" }
            };
            var expectedResponse = new List<FeedbackResponseDto>
            {
                new FeedbackResponseDto { Subject = "Test 1", Message = "Msg 1" }
            };

            _feedbackRepoMock.Setup(r => r.GetAllFeedbacksWithUserAsync())
                .ReturnsAsync(feedbacks);

            _mapperMock.Setup(m => m.Map<List<FeedbackResponseDto>>(feedbacks))
                .Returns(expectedResponse);

            // Act
            var result = await _feedbackService.GetAllFeedbacksAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Subject.Should().Be("Test 1");
        }

        // ==========================================
        // 2. TESTS FOR CreateFeedbackAsync
        // ==========================================
        [Fact]
        public async Task CreateFeedbackAsync_WhenDailyLimitExceeded_ShouldThrowBadRequestException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new CreateFeedbackDto { Subject = "Bug", Message = "Error occurred" };

            // Günlük limit 2 ve kullanıcı zaten 2 tane atmış
            _feedbackRepoMock.Setup(r => r.GetTodayFeedbackCountByUserIdAsync(userId))
                .ReturnsAsync(2);

            _localizerMock.Setup(l => l["Res_Feedback_DailyLimitExceeded"])
                .Returns(new LocalizedString("Res_Feedback_DailyLimitExceeded", "Günlük limit aşıldı."));

            // Act & Assert
            Func<Task> act = async () => await _feedbackService.CreateFeedbackAsync(userId, dto);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Günlük limit aşıldı.");
        }

        [Fact]
        public async Task CreateFeedbackAsync_WhenValid_ShouldCreateFeedbackSuccessfully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new CreateFeedbackDto { Subject = "Bug", Message = "Error occurred" };

            // Bugün hiç feedback atmamış (< 2)
            _feedbackRepoMock.Setup(r => r.GetTodayFeedbackCountByUserIdAsync(userId))
                .ReturnsAsync(0);

            _localizerMock.Setup(l => l["Res_Feedback_Created"])
                .Returns(new LocalizedString("Res_Feedback_Created", "Geri bildirim oluşturuldu."));

            // Act
            var result = await _feedbackService.CreateFeedbackAsync(userId, dto);

            // Assert
            result.Should().Be("Geri bildirim oluşturuldu.");
            _feedbackRepoMock.Verify(r => r.AddAsync(It.IsAny<Feedback>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }

        // ==========================================
        // 3. TESTS FOR ResolveFeedbackAsync
        // ==========================================
        [Fact]
        public async Task ResolveFeedbackAsync_WhenFeedbackNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var feedbackId = Guid.NewGuid();

            _feedbackRepoMock.Setup(r => r.GetFeedbackWithUserByIdAsync(feedbackId))
                .ReturnsAsync((Feedback?)null);

            _localizerMock.Setup(l => l["Res_Feedback_NotFound"])
                .Returns(new LocalizedString("Res_Feedback_NotFound", "Geri bildirim bulunamadı."));

            // Act & Assert
            Func<Task> act = async () => await _feedbackService.ResolveFeedbackAsync(feedbackId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Geri bildirim bulunamadı.");
        }

        [Fact]
        public async Task ResolveFeedbackAsync_WhenFeedbackExists_ShouldResolveSuccessfully()
        {
            // Arrange
            var feedbackId = Guid.NewGuid();
            var feedback = new Feedback { Id = feedbackId, IsResolved = false };

            _feedbackRepoMock.Setup(r => r.GetFeedbackWithUserByIdAsync(feedbackId))
                .ReturnsAsync(feedback);

            _localizerMock.Setup(l => l["Res_Feedback_Resolved"])
                .Returns(new LocalizedString("Res_Feedback_Resolved", "Geri bildirim çözüldü olarak işaretlendi."));

            // Act
            var result = await _feedbackService.ResolveFeedbackAsync(feedbackId);

            // Assert
            result.Should().Be("Geri bildirim çözüldü olarak işaretlendi.");
            feedback.IsResolved.Should().BeTrue();
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }
    }
}