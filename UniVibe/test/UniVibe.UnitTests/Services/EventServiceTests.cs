using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Requests;
using UniVibe.Application.DTOs.Event.Responses;
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
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<ILogger<EventService>> _loggerMock;

        private readonly IValidator<CreateEventRequest> _createValidator;
        private readonly IValidator<GetAllEventsRequest> _getAllValidator;
        private readonly IValidator<CancelEventRequest> _cancelValidator;

        private readonly EventService _eventService;
        private readonly Mock<IEventCancellationJob> _eventCancellationJob;

        public EventServiceTests()
        {
            _eventRepoMock = new Mock<IEventRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _categoryRepoMock = new Mock<IEventCategoryRepository>();
            _imageServiceMock = new Mock<IImageService>();
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();
            _emailServiceMock = new Mock<IEmailService>();
            _loggerMock = new Mock<ILogger<EventService>>();

            _createValidator = new InlineValidator<CreateEventRequest>();
            _getAllValidator = new InlineValidator<GetAllEventsRequest>();
            _cancelValidator = new InlineValidator<CancelEventRequest>();
            _eventCancellationJob = new Mock<IEventCancellationJob>();

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
                _cancelValidator,
                _emailServiceMock.Object,
                _loggerMock.Object,
                _eventCancellationJob.Object
                );
        }

        [Fact]
        public async Task JoinEventAsync_WhenEventNotFound_ShouldThrowNotFoundException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
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
                Status = EventStatus.Pending,
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
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
                UserId = userId,
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(ownEvent);

            _localizerMock.Setup(l => l["Event_CannotJoinOwnEvent"])
                .Returns(new LocalizedString("Event_CannotJoinOwnEvent", "Kendi etkinliğinize katılamazsınız."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Kendi etkinliğinize katılamazsınız.");
        }

        [Fact]
        public async Task CancelEventAsync_WhenUnauthorizedUser_ShouldThrowForbiddenException()
        {
            var eventId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var anotherUserId = Guid.NewGuid();
            var request = new CancelEventRequest { Reason = "Vazgeçtim" };

            var existingEvent = new Event
            {
                Id = eventId,
                UserId = ownerId,
                IsDeleted = false,
                EventDate = DateTime.UtcNow.AddDays(2)
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(existingEvent);

            _localizerMock.Setup(l => l["Event_UnauthorizedCancel"])
                .Returns(new LocalizedString("Event_UnauthorizedCancel", "Bu etkinliği iptal etmeye yetkiniz yok."));

            Func<Task> act = async () => await _eventService.CancelEventAsync(eventId, anotherUserId, request);

            await act.Should().ThrowAsync<ForbiddenException>()
                .WithMessage("Bu etkinliği iptal etmeye yetkiniz yok.");
        }

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

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(validEvent);

            _eventRepoMock.Setup(r => r.GetAttendeeAsync(eventId, userId))
                .ReturnsAsync((EventAttendee?)null);

            _localizerMock.Setup(l => l["Event_NotJoined"])
                .Returns(new LocalizedString("Event_NotJoined", "Bu etkinliğe katılmamışsınız."));

            Func<Task> act = async () => await _eventService.LeaveEventAsync(eventId, userId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Bu etkinliğe katılmamışsınız.");
        }

        [Fact]
        public async Task GetEventStatisticsAsync_ShouldReturnCorrectStatistics()
        {
            _eventRepoMock.Setup(r => r.CountAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(5);

            var result = await _eventService.GetEventStatisticsAsync();

            result.Should().NotBeNull();
            result.TotalCreatedEvents.Should().Be(5);
            result.ActiveEvents.Should().Be(5);
            result.PendingEvents.Should().Be(5);
        }

        [Fact]
        public async Task JoinEventAsync_WhenCapacityIsFull_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var evnt = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Status = EventStatus.Approved,
                EventDate = DateTime.UtcNow.AddHours(5),
                IsDeleted = false,
                Capacity = 2
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            _userRepoMock.Setup(r => r.GetUserWithDetailsByIdAsync(userId))
                .ReturnsAsync(new User { Id = userId, Role = UserRole.Student });

            _eventRepoMock.Setup(r => r.GetLastAttendeeIncludingDeletedAsync(eventId, userId, true))
                .ReturnsAsync((EventAttendee?)null);

            _eventRepoMock.Setup(r => r.GetActiveAttendeeCountAsync(eventId))
                .ReturnsAsync(2);

            _localizerMock.Setup(l => l["Event_CapacityFull"])
                .Returns(new LocalizedString("Event_CapacityFull", "Bu etkinliğin katılımcı kontenjanı dolmuştur."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Bu etkinliğin katılımcı kontenjanı dolmuştur.");

            _eventRepoMock.Verify(r => r.AddAttendeeAsync(It.IsAny<EventAttendee>()), Times.Never);
        }

        [Fact]
        public async Task JoinEventAsync_WhenLeftWithinThreeMinutesAndRejoinsBeforeFiveMinutes_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var evnt = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Status = EventStatus.Approved,
                EventDate = now.AddHours(5),
                IsDeleted = false,
                Capacity = 10
            };

            var previousAttendee = new EventAttendee
            {
                EventId = eventId,
                UserId = userId,
                JoinedAt = now.AddMinutes(-3),
                UpdatedAt = now.AddMinutes(-1),
                IsDeleted = true,
                IsActive = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            _userRepoMock.Setup(r => r.GetUserWithDetailsByIdAsync(userId))
                .ReturnsAsync(new User { Id = userId, Role = UserRole.Student });

            _eventRepoMock.Setup(r => r.GetLastAttendeeIncludingDeletedAsync(eventId, userId, true))
                .ReturnsAsync(previousAttendee);

            _localizerMock.Setup(l => l["Event_RejoinCooldown", It.IsAny<object[]>()])
                .Returns((string key, object[] args) =>
                    new LocalizedString(key, $"Etkinliğe kısa sürede katılıp ayrıldığınız için {args[0]} dakika boyunca tekrar katılamazsınız."));

            Func<Task> act = async () => await _eventService.JoinEventAsync(eventId, userId);

            await act.Should().ThrowAsync<BadRequestException>();
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task JoinEventAsync_WhenFiveMinutesPassedAfterQuickLeave_ShouldReactivateAttendee()
        {
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var evnt = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Status = EventStatus.Approved,
                EventDate = now.AddHours(5),
                IsDeleted = false,
                Capacity = 10
            };

            var previousAttendee = new EventAttendee
            {
                EventId = eventId,
                UserId = userId,
                JoinedAt = now.AddMinutes(-8),
                UpdatedAt = now.AddMinutes(-6),
                IsDeleted = true,
                IsActive = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            _userRepoMock.Setup(r => r.GetUserWithDetailsByIdAsync(userId))
                .ReturnsAsync(new User { Id = userId, Role = UserRole.Student });

            _eventRepoMock.Setup(r => r.GetLastAttendeeIncludingDeletedAsync(eventId, userId, true))
                .ReturnsAsync(previousAttendee);

            _eventRepoMock.Setup(r => r.GetParticipantsByEventIdAsync(eventId))
                .ReturnsAsync(new List<User> { new() });

            _localizerMock.Setup(l => l["Res_Event_Joined"])
                .Returns(new LocalizedString("Res_Event_Joined", "Etkinliğe başarıyla katıldınız."));

            var result = await _eventService.JoinEventAsync(eventId, userId);

            result.Should().Be("Etkinliğe başarıyla katıldınız.");
            previousAttendee.IsDeleted.Should().BeFalse();
            previousAttendee.IsActive.Should().BeTrue();
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateEventAsync_WhenUserAlreadyHasTwoActiveEvents_ShouldThrowConflictException()
        {
            var userId = Guid.NewGuid();
            var request = new CreateEventRequest
            {
                Title = "Üçüncü Etkinlik",
                EventDate = DateTime.UtcNow.AddDays(3),
                Location = "Merkez Kampüs",
                Description = "Açıklama",
                CategoryId = Guid.NewGuid(),
                Capacity = 30
            };

            var existingActiveEvents = new List<Event>
            {
                new() { Id = Guid.NewGuid(), UserId = userId, EventDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.Approved },
                new() { Id = Guid.NewGuid(), UserId = userId, EventDate = DateTime.UtcNow.AddDays(2), Status = EventStatus.Approved }
            };

            _eventRepoMock
                .Setup(r => r.GetAllAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(existingActiveEvents);

            _localizerMock
                .Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, "En fazla 2 aktif etkinlik oluşturabilirsiniz."));

            Func<Task> act = async () => await _eventService.CreateEventAsync(request, userId);

            await act.Should().ThrowAsync<ConflictException>();
            _eventRepoMock.Verify(r => r.AddAsync(It.IsAny<Event>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task GetMyActiveEventAsync_WhenEventsExist_ShouldReturnMappedListWithCreatorInfo()
        {
            var userId = Guid.NewGuid();
            var creator = new User
            {
                Id = userId,
                FirstName = "Mehmet",
                LastName = "Delibaş",
                Department = new Department { Name = "Bilgisayar Mühendisliği" }
            };

            var events = new List<Event>
            {
                new() { Id = Guid.NewGuid(), Title = "Gelecek Etkinlik", UserId = userId, User = creator, EventDate = DateTime.UtcNow.AddDays(5) },
                new() { Id = Guid.NewGuid(), Title = "Geçmiş Etkinlik", UserId = userId, User = creator, EventDate = DateTime.UtcNow.AddDays(-5) }
            };

            var mappedResponses = new List<EventDetailResponse>
            {
                new() { Id = events[0].Id, Title = "Gelecek Etkinlik" },
                new() { Id = events[1].Id, Title = "Geçmiş Etkinlik" }
            };

            _eventRepoMock.Setup(r => r.GetAllEventsByUserIdAsync(userId))
                .ReturnsAsync(events);

            _mapperMock.Setup(m => m.Map<List<EventDetailResponse>>(events))
                .Returns(mappedResponses);

            var result = await _eventService.GetMyAllEventsAsync(userId);

            result.Should().HaveCount(2);
            result.Should().OnlyContain(r => r.IsCreator && r.CreatorName == "Mehmet Delibaş" && r.Department == "Bilgisayar Mühendisliği");
        }
    }
}