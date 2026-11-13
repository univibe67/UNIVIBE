using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class AdminEventServiceTests
    {
        private readonly Mock<IEventRepository> _eventRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;

        private readonly AdminEventService _adminEventService;

        public AdminEventServiceTests()
        {
            _eventRepoMock = new Mock<IEventRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();

            _adminEventService = new AdminEventService(
                _eventRepoMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _localizerMock.Object
            );
        }

        // ==========================================
        // 1. TESTS FOR GetPendingEventsAsync
        // ==========================================
        [Fact]
        public async Task GetPendingEventsAsync_ShouldReturnListOfEventListResponses()
        {
            // Arrange
            var pendingEvents = new List<Event>
            {
                new Event { Id = Guid.NewGuid(), Title = "Pending Event", Status = EventStatus.Pending }
            };
            var expectedResponse = new List<EventListResponse>
            {
                new EventListResponse { Title = "Pending Event" }
            };

            _eventRepoMock.Setup(r => r.GetEventsWithUsersByStatusAsync(EventStatus.Pending))
                .ReturnsAsync(pendingEvents);

            _mapperMock.Setup(m => m.Map<List<EventListResponse>>(pendingEvents))
                .Returns(expectedResponse);

            // Act
            var result = await _adminEventService.GetPendingEventsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result[0].Title.Should().Be("Pending Event");
        }

        // ==========================================
        // 2. TESTS FOR GetAllEventsAsync
        // ==========================================
        [Fact]
        public async Task GetAllEventsAsync_ShouldReturnAllEvents()
        {
            // Arrange
            var allEvents = new List<Event>
            {
                new Event { Id = Guid.NewGuid(), Title = "Event 1", Status = EventStatus.Approved },
                new Event { Id = Guid.NewGuid(), Title = "Event 2", Status = EventStatus.Pending }
            };
            var expectedResponse = new List<EventListResponse>
            {
                new EventListResponse { Title = "Event 1" },
                new EventListResponse { Title = "Event 2" }
            };

            _eventRepoMock.Setup(r => r.GetEventsWithUsersByStatusAsync())
                .ReturnsAsync(allEvents);

            _mapperMock.Setup(m => m.Map<List<EventListResponse>>(allEvents))
                .Returns(expectedResponse);

            // Act
            var result = await _adminEventService.GetAllEventsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
        }

        // ==========================================
        // 3. TESTS FOR ApproveEventAsync
        // ==========================================
        [Fact]
        public async Task ApproveEventAsync_WhenEventNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var eventId = Guid.NewGuid();

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync((Event?)null);

            _localizerMock.Setup(l => l["Res_Event_NotFound"])
                .Returns(new LocalizedString("Res_Event_NotFound", "Etkinlik bulunamadı."));

            // Act & Assert
            Func<Task> act = async () => await _adminEventService.ApproveEventAsync(eventId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Etkinlik bulunamadı.");
        }

        [Fact]
        public async Task ApproveEventAsync_WhenEventIsCancelled_ShouldThrowBadRequestException()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var cancelledEvent = new Event { Id = eventId, Status = EventStatus.Cancelled, IsDeleted = false };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(cancelledEvent);

            // Act & Assert
            Func<Task> act = async () => await _adminEventService.ApproveEventAsync(eventId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("İptal edilmiş bir etkinlik onaylanamaz.");
        }

        [Fact]
        public async Task ApproveEventAsync_WhenEventDateIsInPast_ShouldThrowBadRequestException()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var pastEvent = new Event
            {
                Id = eventId,
                Status = EventStatus.Pending,
                EventDate = DateTime.UtcNow.AddDays(-1), // Geçmiş tarih
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(pastEvent);

            // Act & Assert
            Func<Task> act = async () => await _adminEventService.ApproveEventAsync(eventId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Tarihi geçmiş bir etkinlik onaylanamaz.");
        }

        [Fact]
        public async Task ApproveEventAsync_WhenValidPendingEvent_ShouldApproveSuccessfully()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var validEvent = new Event
            {
                Id = eventId,
                Status = EventStatus.Pending,
                EventDate = DateTime.UtcNow.AddDays(5), // Gelecek tarih
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(validEvent);

            _localizerMock.Setup(l => l["Res_Event_Approved"])
                .Returns(new LocalizedString("Res_Event_Approved", "Etkinlik onaylandı."));

            // Act
            var result = await _adminEventService.ApproveEventAsync(eventId);

            // Assert
            result.Should().Be("Etkinlik onaylandı.");
            validEvent.Status.Should().Be(EventStatus.Approved);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
        }

        // ==========================================
        // 4. TESTS FOR RejectEventAsync
        // ==========================================
        [Fact]
        public async Task RejectEventAsync_WhenReasonIsNullOrWhiteSpace_ShouldThrowBadRequestException()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            string reason = "   "; // Boş sebep

            _localizerMock.Setup(l => l["Res_Event_ReasonRequired"])
                .Returns(new LocalizedString("Res_Event_ReasonRequired", "Red sebebi zorunludur."));

            // Act & Assert
            Func<Task> act = async () => await _adminEventService.RejectEventAsync(eventId, reason);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Red sebebi zorunludur.");
        }

        [Fact]
        public async Task RejectEventAsync_WhenValid_ShouldRejectSuccessfully()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            string reason = "Uygunsuz içerik";
            var eventEntity = new Event { Id = eventId, Status = EventStatus.Pending, IsDeleted = false };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>()))
                .ReturnsAsync(eventEntity);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // 💡 EKSİK OLAN LOCALIZER AYARI BURASI:
            _localizerMock.Setup(l => l["Res_Event_Rejected"])
                .Returns(new LocalizedString("Res_Event_Rejected", "Etkinlik reddedildi."));

            // Act
            var result = await _adminEventService.RejectEventAsync(eventId, reason);

            // Assert
            result.Should().Be("Etkinlik reddedildi.");
            eventEntity.Status.Should().Be(EventStatus.Rejected);
            eventEntity.RejectionReason.Should().Be(reason);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        // ==========================================
        // 5. TESTS FOR GetEventDetailsByIdAsync
        // ==========================================
        [Fact]
        public async Task GetEventDetailsByIdAsync_WhenEventNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var eventId = Guid.NewGuid();

            _eventRepoMock.Setup(r => r.GetEventWithDetailsByIdAsync(eventId))
                .ReturnsAsync((Event?)null);

            _localizerMock.Setup(l => l["Event_NotFound"])
                .Returns(new LocalizedString("Event_NotFound", "Etkinlik bulunamadı."));

            // Act & Assert
            Func<Task> act = async () => await _adminEventService.GetEventDetailsByIdAsync(eventId);

            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Etkinlik bulunamadı.");
        }

        [Fact]
        public async Task GetEventDetailsByIdAsync_WhenEventExists_ShouldReturnDetails()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Concert",
                User = new User { FirstName = "Ahmet", LastName = "Yılmaz" }
            };
            var expectedResponse = new EventDetailResponse { Title = "Concert" };

            _eventRepoMock.Setup(r => r.GetEventWithDetailsByIdAsync(eventId))
                .ReturnsAsync(eventEntity);

            _mapperMock.Setup(m => m.Map<EventDetailResponse>(eventEntity))
                .Returns(expectedResponse);

            // Act
            var result = await _adminEventService.GetEventDetailsByIdAsync(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Concert");
            result.CreatorName.Should().Be("Ahmet Yılmaz");
        }
    }
}