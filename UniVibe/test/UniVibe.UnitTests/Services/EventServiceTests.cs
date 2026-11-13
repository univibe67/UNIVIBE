using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class EventServiceTests
    {
        private readonly Mock<IEventRepository> _eventRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IEventCategoryRepository> _categoryRepoMock;
        private readonly Mock<IImageService> _imageServiceMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;

        // Validator'lar için InlineValidator kullanarak NullReferenceException'ı engelliyoruz
        private readonly IValidator<CreateEventRequest> _createValidator;
        private readonly IValidator<GetAllEventsRequest> _getAllValidator;
        private readonly IValidator<CancelEventRequest> _cancelValidator;

        private readonly EventService _eventService;

        public EventServiceTests()
        {
            _eventRepoMock = new Mock<IEventRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _categoryRepoMock = new Mock<IEventCategoryRepository>();
            _imageServiceMock = new Mock<IImageService>();
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();

            _createValidator = new InlineValidator<CreateEventRequest>();
            _getAllValidator = new InlineValidator<GetAllEventsRequest>();
            _cancelValidator = new InlineValidator<CancelEventRequest>();

            _eventService = new EventService(
                _eventRepoMock.Object,
                _categoryRepoMock.Object,
                _imageServiceMock.Object,
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _createValidator,
                _getAllValidator,
                _userRepoMock.Object,
                _cancelValidator
            );
        }

        // ==========================================
        // 1. TESTS FOR JoinEventAsync
        // ==========================================
        [Fact]
        public async Task JoinEventAsync_WhenEventNotFound_ShouldThrowNotFoundException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync((Event?)null);

            _localizerMock.Setup(l => l["Event_NotFound"])
                .Returns(new LocalizedString("Event_NotFound", "Etkinlik bulunamadı."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Etkinlik bulunamadı.");
        }

        [Fact]
        public async Task JoinEventAsync_WhenEventIsNotApproved_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var unapprovedEvent = new Event
            {
                Id = eventId,
                Status = EventStatus.Pending, // Onaylanmamış
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(unapprovedEvent);

            _localizerMock.Setup(l => l["Event_NotApproved"])
                .Returns(new LocalizedString("Event_NotApproved", "Etkinlik onaylanmamış."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Etkinlik onaylanmamış.");
        }

        [Fact]
        public async Task JoinEventAsync_WhenUserTriesToJoinOwnEvent_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var ownEvent = new Event
            {
                Id = eventId,
                Status = EventStatus.Approved,
                EventDate = DateTime.UtcNow.AddDays(1),
                UserId = userId, // Etkinliği oluşturan kişi ile katılan aynı
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(ownEvent);

            _localizerMock.Setup(l => l["Event_CannotJoinOwnEvent"])
                .Returns(new LocalizedString("Event_CannotJoinOwnEvent", "Kendi etkinliğinize katılamazsınız."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Kendi etkinliğinize katılamazsınız.");
        }

        // ==========================================
        // 2. TESTS FOR CancelEventAsync
        // ==========================================
        [Fact]
        public async Task CancelEventAsync_WhenUnauthorizedUser_ShouldThrowForbiddenException()
        {
            var eventId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var anotherUserId = Guid.NewGuid(); // Başka bir kullanıcı iptal etmeye çalışıyor
            var request = new CancelEventRequest { Reason = "Vazgeçtim" };

            var existingEvent = new Event
            {
                Id = eventId,
                UserId = ownerId,
                IsDeleted = false,
                EventDate = DateTime.UtcNow.AddDays(2)
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(existingEvent);

            _localizerMock.Setup(l => l["Event_UnauthorizedCancel"])
                .Returns(new LocalizedString("Event_UnauthorizedCancel", "Bu etkinliği iptal etmeye yetkiniz yok."));

            Func<Task> act = async () => await _eventService.CancelEventAsync(eventId, anotherUserId, request);

            await act.Should().ThrowAsync<ForbiddenException>()
                .WithMessage("Bu etkinliği iptal etmeye yetkiniz yok.");
        }

        // ==========================================
        // 3. TESTS FOR LeaveEventAsync
        // ==========================================
        [Fact]
        public async Task LeaveEventAsync_WhenNotJoined_ShouldThrowNotFoundException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var validEvent = new Event
            {
                Id = eventId,
                EventDate = DateTime.UtcNow.AddDays(1),
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(validEvent);

            // Kullanıcı katılım kaydı yok (null dönüyor)
            _eventRepoMock.Setup(r => r.GetAttendeeAsync(eventId, userId))
                .ReturnsAsync((EventAttendee?)null);

            _localizerMock.Setup(l => l["Event_NotJoined"])
                .Returns(new LocalizedString("Event_NotJoined", "Bu etkinliğe katılmamışsınız."));

            Func<Task> act = async () => await _eventService.LeaveEventAsync(eventId, userId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Bu etkinliğe katılmamışsınız.");
        }
    }
}