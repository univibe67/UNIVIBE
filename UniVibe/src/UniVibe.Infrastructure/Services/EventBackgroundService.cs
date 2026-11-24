using System.Globalization;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using UniVibe.Application.Common;
using UniVibe.Application.Interfaces;
using UniVibe.Domain.Enums;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Services
{
    public class EventBackgroundService : IEventBackgroundService
    {
        private const int CompletionDelayHours = 3;
        private const int ReminderLeadHours = 1;

        private readonly UniVibeDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly ILogger<EventBackgroundService> _logger;

        public EventBackgroundService(
            UniVibeDbContext context,
            IEmailService emailService,
            IBackgroundJobClient backgroundJobClient,
            IStringLocalizer<SharedResources> localizer,
            ILogger<EventBackgroundService> logger)
        {
            _context = context;
            _emailService = emailService;
            _backgroundJobClient = backgroundJobClient;
            _localizer = localizer;
            _logger = logger;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 300)]
        public async Task CheckAndUpdateCompletedEventsAsync()
        {
            var culture = new CultureInfo("tr-TR");
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;

            var utcNow = DateTime.UtcNow;

            await CompleteExpiredEventsAsync(utcNow);
            await RejectExpiredPendingEventsAsync(utcNow);
            await DispatchUpcomingEventRemindersAsync(utcNow);
        }

        private async Task CompleteExpiredEventsAsync(DateTime utcNow)
        {
            var threshold = utcNow.AddHours(-CompletionDelayHours);

            var expiredEvents = await _context.Events
                .Include(e => e.User)
                .Where(e => e.EventDate < threshold && e.Status == EventStatus.Approved)
                .ToListAsync();

            foreach (var ev in expiredEvents)
            {
                ev.Status = EventStatus.Completed;
                ev.UpdatedAt = utcNow;

                await _context.SaveChangesAsync();

                if (ev.User != null && !string.IsNullOrWhiteSpace(ev.User.Email))
                {
                    var subject = _localizer["EventCompletedSubject"].Value;
                    var body = string.Format(
                        _localizer["EventCompletedBody"].Value,
                        ev.User.FirstName,
                        ev.Title);

                    EnqueueEmail(ev.User.Email, subject, body, ev.Id, "Completion");
                }
            }
        }

        private async Task RejectExpiredPendingEventsAsync(DateTime utcNow)
        {
            var expiredPendingEvents = await _context.Events
                .Where(e => e.Status == EventStatus.Pending && e.EventDate < utcNow)
                .ToListAsync();

            if (expiredPendingEvents.Count == 0)
                return;

            foreach (var pendingEv in expiredPendingEvents)
            {
                pendingEv.Status = EventStatus.Rejected;
                pendingEv.RejectionReason = "Etkinlik tarihi onaylanmadan geçtiği için reddedildi.";
                pendingEv.UpdatedAt = utcNow;
            }

            await _context.SaveChangesAsync();
        }

        private async Task DispatchUpcomingEventRemindersAsync(DateTime utcNow)
        {
            var reminderWindowEnd = utcNow.AddHours(ReminderLeadHours);

            var upcomingEvents = await _context.Events
                .Include(e => e.User)
                .Include(e => e.Attendees)
                    .ThenInclude(ea => ea.User)
                .Where(e => e.EventDate <= reminderWindowEnd &&
                            e.EventDate > utcNow &&
                            e.Status == EventStatus.Approved &&
                            !e.IsReminderSent)
                .ToListAsync();

            if (upcomingEvents.Count == 0)
                return;

            var turkeyTimeZone = GetTurkeyTimeZone();

            foreach (var ev in upcomingEvents)
            {
                var utcDate = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc);
                var localEventTime = TimeZoneInfo.ConvertTimeFromUtc(utcDate, turkeyTimeZone);
                var formattedTime = localEventTime.ToString("HH:mm");
                var remainingMinutes = Math.Max(0, (int)Math.Round((ev.EventDate - utcNow).TotalMinutes));

                ev.IsReminderSent = true;
                ev.UpdatedAt = utcNow;
                await _context.SaveChangesAsync();

                if (ev.User != null && !string.IsNullOrWhiteSpace(ev.User.Email))
                {
                    var organizerSubject = string.Format(
                        _localizer["OrganizerReminderSubject"].Value,
                        ev.Title,
                        remainingMinutes);

                    var organizerBody = string.Format(
                        _localizer["OrganizerReminderBody"].Value,
                        ev.User.FirstName,
                        ev.Title,
                        formattedTime,
                        remainingMinutes);

                    EnqueueEmail(ev.User.Email, organizerSubject, organizerBody, ev.Id, "OrganizerReminder");
                }

                if (ev.Attendees == null)
                    continue;

                foreach (var attendeeRelation in ev.Attendees)
                {
                    if (attendeeRelation.IsDeleted)
                        continue;

                    var attendee = attendeeRelation.User;
                    if (attendee == null || string.IsNullOrWhiteSpace(attendee.Email))
                        continue;

                    var attendeeSubject = string.Format(
                        _localizer["AttendeeReminderSubject"].Value,
                        remainingMinutes);

                    var attendeeBody = string.Format(
                        _localizer["AttendeeReminderBody"].Value,
                        attendee.FirstName,
                        ev.Title,
                        formattedTime,
                        remainingMinutes);

                    EnqueueEmail(attendee.Email, attendeeSubject, attendeeBody, ev.Id, "AttendeeReminder");
                }
            }
        }

        private void EnqueueEmail(string to, string subject, string body, Guid eventId, string mailType)
        {
            try
            {
                _backgroundJobClient.Enqueue<IEmailService>(service => service.SendEmailAsync(to, subject, body));
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "{MailType} e-postası kuyruğa eklenemedi. EventId: {EventId}, Recipient: {Recipient}",
                    mailType,
                    eventId,
                    to);
            }
        }

        private static TimeZoneInfo GetTurkeyTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
            }
        }
    }
}