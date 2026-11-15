using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using UniVibe.Application.Common;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;

namespace UniVibe.Infrastructure.Jobs
{
    public class EventCancellationEmailProcessor
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEmailService _emailService;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly ILogger<EventCancellationEmailProcessor> _logger;

        public EventCancellationEmailProcessor(
            IEventRepository eventRepository,
            IEmailService emailService,
            IStringLocalizer<SharedResources> localizer,
            ILogger<EventCancellationEmailProcessor> logger)
        {
            _eventRepository = eventRepository;
            _emailService = emailService;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task ProcessAsync(Guid eventId, string reason)
        {
            var existingEvent = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId);
            if (existingEvent == null) return;

            var participants = await _eventRepository.GetParticipantsByEventIdAsync(eventId);
            if (participants == null || !participants.Any()) return;

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
    }
}