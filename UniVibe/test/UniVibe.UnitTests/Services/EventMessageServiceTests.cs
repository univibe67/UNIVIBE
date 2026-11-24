using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Localization;
using Moq;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Message.Requests;
using UniVibe.Application.DTOs.Message.Responses;
using UniVibe.Application.Exceptions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Application.Services;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.UnitTests.Services
{
    public class EventMessageServiceTests
    {
        private readonly Mock<IEventMessageRepository> _messageRepoMock = new();
        private readonly Mock<IEventRepository> _eventRepoMock = new();
        private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IStringLocalizer<SharedResources>> _localizerMock = new();
        private readonly IValidator<SendMessageRequest> _validator = new InlineValidator<SendMessageRequest>();

        private readonly EventMessageService _sut;

        public EventMessageServiceTests()
        {
            _localizerMock.Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));

            _sut = new EventMessageService(
                _messageRepoMock.Object,
                _eventRepoMock.Object,
                _unitOfWorkMock.Object,
                _mapperMock.Object,
                _localizerMock.Object,
                _validator);
        }

        [Fact]
        public async Task SendMessageAsync_WhenEventIsApprovedActiveAndWithinThreeHours_ShouldSucceed()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var evnt = new Event
            {
                Id = eventId,
                UserId = userId,
                Status = EventStatus.Approved,
                IsActive = true,
                EventDate = DateTime.UtcNow.AddHours(-1) // Bitişine 2 saat var
            };

            _eventRepoMock
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            _messageRepoMock
                .Setup(r => r.GetLastMessageByEventIdAsync(eventId, userId))
                .ReturnsAsync((EventMessage?)null);

            _messageRepoMock
                .Setup(r => r.GetByIdWithUserAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new EventMessage { Id = Guid.NewGuid(), EventId = eventId, UserId = userId, Content = "Selam" });

            _mapperMock
                .Setup(m => m.Map<EventMessageResponse>(It.IsAny<EventMessage>()))
                .Returns(new EventMessageResponse { Content = "Selam" });

            var result = await _sut.SendMessageAsync(eventId, userId, new SendMessageRequest("Selam"));

            result.Content.Should().Be("Selam");
            _messageRepoMock.Verify(r => r.AddAsync(It.IsAny<EventMessage>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Theory]
        [InlineData(EventStatus.Cancelled)]
        [InlineData(EventStatus.Rejected)]
        [InlineData(EventStatus.Pending)]
        [InlineData(EventStatus.Completed)]
        public async Task SendMessageAsync_WhenEventStatusIsNotApproved_ShouldThrowBadRequestException(EventStatus status)
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var evnt = new Event
            {
                Id = eventId,
                UserId = userId,
                Status = status,
                IsActive = true,
                EventDate = DateTime.UtcNow.AddHours(2)
            };

            _eventRepoMock
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            Func<Task> act = async () => await _sut.SendMessageAsync(eventId, userId, new SendMessageRequest("Mesaj"));

            await act.Should().ThrowAsync<BadRequestException>();
            _messageRepoMock.Verify(r => r.AddAsync(It.IsAny<EventMessage>()), Times.Never);
        }

        [Fact]
        public async Task SendMessageAsync_WhenMoreThanThreeHoursPassedSinceEventDate_ShouldThrowBadRequestException()
        {
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var evnt = new Event
            {
                Id = eventId,
                UserId = userId,
                Status = EventStatus.Approved,
                IsActive = true,
                EventDate = DateTime.UtcNow.AddHours(-3).AddMinutes(-1)
            };

            _eventRepoMock
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<Event, bool>>>(), It.IsAny<bool>()))
                .ReturnsAsync(evnt);

            Func<Task> act = async () => await _sut.SendMessageAsync(eventId, userId, new SendMessageRequest("Geç mesaj"));

            await act.Should().ThrowAsync<BadRequestException>();
            _messageRepoMock.Verify(r => r.AddAsync(It.IsAny<EventMessage>()), Times.Never);
        }
    }
}