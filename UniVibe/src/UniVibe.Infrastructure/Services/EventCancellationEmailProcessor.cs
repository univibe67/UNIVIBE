using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using UniVibe.Application.Common;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.Infrastructure.Jobs
{
    public class EventCancellationEmailProcessor
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly ILogger<EventCancellationEmailProcessor> _logger;

        public EventCancellationEmailProcessor(
            IEventRepository eventRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResources> localizer,
            ILogger<EventCancellationEmailProcessor> logger)
        {
            _eventRepository = eventRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task ProcessAsync(Guid eventId, string reason)
        {
            var existingEvent = await _eventRepository.GetEventWithDetailsByIdAsync(eventId, trackChanges: true);
            if (existingEvent == null) return;

            var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);

            if (participants != null && participants.Count > 0)
            {
                foreach (var participant in participants)
                {
                    if (!string.IsNullOrEmpty(participant.Email))
                    {
                        try
                        {
                            string subject = _localizer["EventCancelledParticipantSubject"].Value;
                            string template = _localizer["EventCancelledParticipantBody"].Value;
                            string body = string.Format(template, participant.FirstName, existingEvent.Title, reason);

                            await _emailService.SendEmailAsync(participant.Email, subject, body);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Katılımcıya iptal e-postası gönderilemedi. Email: {Email}", participant.Email);
                        }
                    }
                }
            }

            if ((existingEvent.Status == EventStatus.Cancelled || existingEvent.Status == EventStatus.Rejected)
                && existingEvent.Attendees != null)
            {
                var activeAttendees = existingEvent.Attendees.Where(a => !a.IsDeleted).ToList();

                if (activeAttendees.Count > 0)
                {
                    foreach (var attendee in activeAttendees)
                    {
                        _eventRepository.RemoveAttendee(attendee);
                    }

                    await _unitOfWork.SaveChangesAsync();
                }
            }
        }
    }
}