using System.Globalization;
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
        private readonly UniVibeDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IStringLocalizer<SharedResources> _localizer;
        private readonly ILogger<EventBackgroundService> _logger;

        public EventBackgroundService(
            UniVibeDbContext context,
            IEmailService emailService,
            IStringLocalizer<SharedResources> localizer,
            ILogger<EventBackgroundService> logger)
        {
            _context = context;
            _emailService = emailService;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task CheckAndUpdateCompletedEventsAsync()
        {
            var culture = new CultureInfo("tr-TR");
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;

            var utcNow = DateTime.UtcNow;

            var completionThreshold = utcNow.AddHours(-3);

            var expiredEvents = await _context.Events
                .Include(e => e.User)
                .Where(e => e.EventDate < completionThreshold && e.Status == EventStatus.Approved)
                .ToListAsync();

            foreach (var ev in expiredEvents)
            {
                ev.Status = EventStatus.Completed;
                ev.UpdatedAt = utcNow;

                if (ev.User != null && !string.IsNullOrEmpty(ev.User.Email))
                {
                    try
                    {
                        var subject = _localizer["EventCompletedSubject"].Value;
                        var body = string.Format(_localizer["EventCompletedBody"].Value, ev.User.FirstName, ev.Title);

                        await _emailService.SendEmailAsync(ev.User.Email, subject, body);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Etkinlik tamamlanma e-postası gönderilemedi. EventId: {EventId}", ev.Id);
                    }
                }
            }

            var expiredPendingEvents = await _context.Events
                .Where(e => e.Status == EventStatus.Pending && e.EventDate < utcNow)
                .ToListAsync();

            foreach (var pendingEv in expiredPendingEvents)
            {
                pendingEv.Status = EventStatus.Rejected;
                pendingEv.RejectionReason = "Etkinlik tarihi onaylanmadan geçtiği için reddedildi.";
                pendingEv.UpdatedAt = utcNow;
            }

            var oneHourLater = utcNow.AddHours(1);

            var upcomingEvents = await _context.Events
                .Include(e => e.User)
                .Include(e => e.Attendees)
                    .ThenInclude(ea => ea.User)
                .Where(e => e.EventDate <= oneHourLater &&
                            e.EventDate > utcNow &&
                            e.Status == EventStatus.Approved &&
                            !e.IsReminderSent)
                .ToListAsync();

            TimeZoneInfo turkeyTimeZone;
            try
            {
                turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
            }

            foreach (var ev in upcomingEvents)
            {
                var utcDate = DateTime.SpecifyKind(ev.EventDate, DateTimeKind.Utc);
                var localEventTime = TimeZoneInfo.ConvertTimeFromUtc(utcDate, turkeyTimeZone);
                var formattedTime = localEventTime.ToString("HH:mm");
                var remainingMinutes = Math.Max(0, (int)Math.Round((ev.EventDate - utcNow).TotalMinutes));

                if (ev.User != null && !string.IsNullOrEmpty(ev.User.Email))
                {
                    try
                    {
                        var subject = string.Format(_localizer["OrganizerReminderSubject"].Value, ev.Title, remainingMinutes);
                        var body = string.Format(_localizer["OrganizerReminderBody"].Value, ev.User.FirstName, ev.Title, formattedTime, remainingMinutes);

                        await _emailService.SendEmailAsync(ev.User.Email, subject, body);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Organizatör hatırlatma e-postası gönderilemedi. EventId: {EventId}, UserId: {UserId}", ev.Id, ev.User.Id);
                    }
                }

                if (ev.Attendees != null)
                {
                    foreach (var attendeeRelation in ev.Attendees)
                    {
                        if (attendeeRelation.IsDeleted)
                            continue;

                        var attendee = attendeeRelation.User;
                        if (attendee != null && !string.IsNullOrEmpty(attendee.Email))
                        {
                            try
                            {
                                var subject = string.Format(_localizer["AttendeeReminderSubject"].Value, remainingMinutes);
                                var body = string.Format(_localizer["AttendeeReminderBody"].Value, attendee.FirstName, ev.Title, formattedTime, remainingMinutes);

                                await _emailService.SendEmailAsync(attendee.Email, subject, body);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Katılımcı hatırlatma e-postası gönderilemedi. EventId: {EventId}, AttendeeUserId: {AttendeeUserId}", ev.Id, attendee.Id);
                            }
                        }
                    }
                }

                ev.IsReminderSent = true;
                ev.UpdatedAt = utcNow;
            }

            if (expiredEvents.Any() || expiredPendingEvents.Any() || upcomingEvents.Any())
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}