using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class AdminEventServiceTests
    {
        private readonly Mock<IEventRepository> _eventRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;        
        private readonly Mock<IEmailService> _emailServiceMock;       
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock;
        private readonly Mock<ILogger<AdminEventService>> _loggerMock;
        private readonly Mock<IEventCancellationJob> _eventCancellationJobMock;

        private readonly AdminEventService _adminEventService;

        public AdminEventServiceTests()
        {
            _eventRepoMock = new Mock<IEventRepository>();
            _userRepoMock = new Mock<IUserRepository>();          
            _emailServiceMock = new Mock<IEmailService>();       
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _localizerMock = new Mock<IStringLocalizer<SharedResources>>();
            _loggerMock = new Mock<ILogger<AdminEventService>>();
            _eventCancellationJobMock = new Mock<IEventCancellationJob>();

            _adminEventService = new AdminEventService(
                _eventRepoMock.Object,
                _userRepoMock.Object,
                _emailServiceMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _localizerMock.Object,
                _loggerMock.Object,
                _eventCancellationJobMock.Object
            );
        }

        // ==========================================
        // 1. TESTS FOR GetPendingEventsAsync
        // ==========================================
        [Fact]
        public async Task GetPendingEventsAsync_ShouldReturnPagedPendingEvents()
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

            _eventRepoMock
                .Setup(r => r.GetPagedEventsAsync(1, 10, false, null, null, EventStatus.Pending))
                .ReturnsAsync((pendingEvents, 1));

            _mapperMock
                .Setup(m => m.Map<List<EventListResponse>>(pendingEvents))
                .Returns(expectedResponse);

            // Act
            var result = await _adminEventService.GetPendingEventsAsync();

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.PageNumber.Should().Be(1);
            result.PageSize.Should().Be(10);
            result.Items.Should().HaveCount(1);
            result.Items[0].Title.Should().Be("Pending Event");
        }

        // ==========================================
        // 2. TESTS FOR GetAllEventsAsync
        // ==========================================
        [Fact]
        public async Task GetAllEventsAsync_ShouldReturnPagedAllEvents()
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

            _eventRepoMock
                .Setup(r => r.GetPagedEventsAsync(1, 10, false, null, null, null))
                .ReturnsAsync((allEvents, 2));

            _mapperMock
                .Setup(m => m.Map<List<EventListResponse>>(allEvents))
                .Returns(expectedResponse);

            // Act
            var result = await _adminEventService.GetAllEventsAsync();

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(2);
            result.PageNumber.Should().Be(1);
            result.PageSize.Should().Be(10);
            result.Items.Should().HaveCount(2);
            result.Items[0].Title.Should().Be("Event 1");
            result.Items[1].Title.Should().Be("Event 2");
        }

        // ==========================================
        // 3. TESTS FOR ApproveEventAsync
        // ==========================================
        [Fact]
        public async Task ApproveEventAsync_WhenEventNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var eventId = Guid.NewGuid();

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
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
            var eventId = Guid.NewGuid();
            var cancelledEvent = new Event { Id = eventId, Status = EventStatus.Cancelled, IsDeleted = false };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(cancelledEvent);

            _localizerMock.Setup(l => l["Admin_EventCannotApproveCancelled"])
                .Returns(new LocalizedString("Admin_EventCannotApproveCancelled", "İptal edilmiş bir etkinlik onaylanamaz."));

            Func<Task> act = async () => await _adminEventService.ApproveEventAsync(eventId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("İptal edilmiş bir etkinlik onaylanamaz.");
        }

        [Fact]
        public async Task ApproveEventAsync_WhenEventDateIsInPast_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var pastEvent = new Event
            {
                Id = eventId,
                Status = EventStatus.Pending,
                EventDate = DateTime.UtcNow.AddDays(-1),
                IsDeleted = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(pastEvent);

            _localizerMock.Setup(l => l["Admin_EventCannotApprovePast"])
                .Returns(new LocalizedString("Admin_EventCannotApprovePast", "Tarihi geçmiş bir etkinlik onaylanamaz."));

            Func<Task> act = async () => await _adminEventService.ApproveEventAsync(eventId);

            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage("Tarihi geçmiş bir etkinlik onaylanamaz.");
        }

        [Fact]
        public async Task ApproveEventAsync_WhenValidPendingEvent_ShouldApproveSuccessfully()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();

            var validEvent = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Status = EventStatus.Pending,
                EventDate = DateTime.UtcNow.AddDays(5), // Gelecek tarih
                IsDeleted = false
            };

            var activeOrganizer = new User
            {
                Id = organizerId,
                IsActive = true,
                IsDeleted = false,
                IsBannedByAdmin = false
            };

            _eventRepoMock.Setup(r => r.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(validEvent);

            _userRepoMock.Setup(r => r.GetByIdIncludingDeletedAsync(organizerId, It.IsAny<bool>()))
                .ReturnsAsync(activeOrganizer);

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

            // 🚀 Tüm olası null reference tuzaklarını engellemek için nesneyi eksiksiz dolduruyoruz
            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Yaz Konseri",
                Status = EventStatus.Pending,
                IsDeleted = false,
                EventDate = DateTime.UtcNow.AddDays(1),
                User = new User { FirstName = "Ahmet", Email = "ahmet@test.com" }
            };

            _eventRepoMock.Setup(r => r.GetEventWithDetailsByIdAsync(eventId, true))
                .ReturnsAsync(eventEntity);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _localizerMock.Setup(l => l["Res_Event_Rejected"])
                .Returns(new LocalizedString("Res_Event_Rejected", "Etkinlik reddedildi."));

            // 💡 E-posta şablon localizer mock'ları da ekleyelim ki mail bloğunda patlamasın
            _localizerMock.Setup(l => l["EventRejectedEmailSubject"])
                .Returns(new LocalizedString("EventRejectedEmailSubject", "Red Konusu"));
            _localizerMock.Setup(l => l["EventRejectedEmailBody"])
                .Returns(new LocalizedString("EventRejectedEmailBody", "Merhaba {0}, {1} etkinliğiniz reddedildi. Sebep: {2}"));

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

            _eventRepoMock.Setup(r => r.GetEventWithDetailsByIdAsync(eventId, It.IsAny<bool>()))
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

            _eventRepoMock.Setup(r => r.GetEventWithDetailsByIdAsync(eventId, It.IsAny<bool>()))
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
        [Fact]
        public async Task RejectEventAsync_WhenApprovedEventHasActiveAttendees_ShouldEnqueueCancellationJob()
        {
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var reason = "Etkinlik programında değişiklik yapıldı.";

            var approvedEvent = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Title = "Yapay Zeka Semineri",
                EventDate = DateTime.UtcNow.AddDays(2),
                Status = EventStatus.Approved,
                IsDeleted = false,
                User = new User
                {
                    Id = organizerId,
                    FirstName = "Ahmet",
                    Email = "ahmet@univibe.edu.tr"
                },
                Attendees = new List<EventAttendee>
                {
                    new()
                    {
                        EventId = eventId,
                        UserId = Guid.NewGuid(),
                        IsDeleted = false,
                        IsActive = true
                    }
                }
            };

            _eventRepoMock
                .Setup(r => r.GetEventWithDetailsByIdAsync(eventId, true))
                .ReturnsAsync(approvedEvent);

            _localizerMock
                .Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));

            var result = await _adminEventService.RejectEventAsync(eventId, reason);

            approvedEvent.Status.Should().Be(EventStatus.Rejected);
            approvedEvent.RejectionReason.Should().Be(reason);
            result.Should().Be("Res_Event_Rejected");

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            _emailServiceMock.Verify(
                e => e.SendEmailAsync(
                    "ahmet@univibe.edu.tr",
                    "EventRejectedEmailSubject",
                    It.IsAny<string>()),
                Times.Once);
            _eventCancellationJobMock.Verify(j => j.Enqueue(eventId, reason), Times.Once);
        }

        [Fact]
        public async Task RejectEventAsync_WhenPendingEventIsRejected_ShouldNotEnqueueCancellationJob()
        {
            var eventId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var reason = "Eksik bilgi.";

            var pendingEvent = new Event
            {
                Id = eventId,
                UserId = organizerId,
                Title = "Kulüp Tanıtımı",
                EventDate = DateTime.UtcNow.AddDays(3),
                Status = EventStatus.Pending,
                IsDeleted = false,
                User = new User
                {
                    Id = organizerId,
                    FirstName = "Mehmet",
                    Email = "mehmet@univibe.edu.tr"
                },
                Attendees = new List<EventAttendee>()
            };

            _eventRepoMock
                .Setup(r => r.GetEventWithDetailsByIdAsync(eventId, true))
                .ReturnsAsync(pendingEvent);

            _localizerMock
                .Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));

            await _adminEventService.RejectEventAsync(eventId, reason);

            pendingEvent.Status.Should().Be(EventStatus.Rejected);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            _eventCancellationJobMock.Verify(j => j.Enqueue(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
        }
    }
}