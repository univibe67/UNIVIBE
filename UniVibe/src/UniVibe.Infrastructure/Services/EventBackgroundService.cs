using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using UniVibe.Application.Interfaces;
using UniVibe.Domain.Enums;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Services
{
    public class EventBackgroundService : IEventBackgroundService
    {
        private readonly UniVibeDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IStringLocalizer<EventBackgroundService> _localizer;

        public EventBackgroundService(
            UniVibeDbContext context,
            IEmailService emailService,
            IStringLocalizer<EventBackgroundService> localizer)
        {
            _context = context;
            _emailService = emailService;
            _localizer = localizer;
        }

        public async Task CheckAndUpdateCompletedEventsAsync()
        {
            var utcNow = DateTime.UtcNow;

            var expiredEvents = await _context.Events
                .Include(e => e.User)
                .Where(e => e.EventDate < utcNow && e.Status == EventStatus.Approved)
                .ToListAsync();

            foreach (var ev in expiredEvents)
            {
                ev.Status = EventStatus.Completed;
                ev.UpdatedAt = utcNow;

                if (ev.User != null && !string.IsNullOrEmpty(ev.User.Email))
                {
                    var subject = _localizer["EventCompletedSubject"];
                    var body = string.Format(_localizer["EventCompletedBody"], ev.User.FirstName, ev.Title);

                    await _emailService.SendEmailAsync(ev.User.Email, subject, body);
                }
            }

            var oneHourLater = utcNow.AddHours(1);
            var windowStart = oneHourLater.AddMinutes(-5);
            var windowEnd = oneHourLater.AddMinutes(5);

            var upcomingEvents = await _context.Events
                .Include(e => e.User)
                .Include(e => e.Attendees)
                    .ThenInclude(ea => ea.User)
                .Where(e => e.EventDate >= windowStart && e.EventDate <= windowEnd && e.Status == EventStatus.Approved)
                .ToListAsync();

            var turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");

            foreach (var ev in upcomingEvents)
            {
                var localEventTime = TimeZoneInfo.ConvertTimeFromUtc(ev.EventDate, turkeyTimeZone);
                var formattedTime = localEventTime.ToString("HH:mm");
                var remainingMinutes = (int)Math.Round((ev.EventDate - utcNow).TotalMinutes);

                if (ev.User != null && !string.IsNullOrEmpty(ev.User.Email))
                {
                    var subject = string.Format(_localizer["OrganizerReminderSubject"], ev.Title, remainingMinutes);
                    var body = string.Format(_localizer["OrganizerReminderBody"], ev.User.FirstName, ev.Title, formattedTime, remainingMinutes);

                    await _emailService.SendEmailAsync(ev.User.Email, subject, body);
                }

                if (ev.Attendees != null)
                {
                    foreach (var attendeeRelation in ev.Attendees)
                    {
                        var attendee = attendeeRelation.User;
                        if (attendee != null && !string.IsNullOrEmpty(attendee.Email))
                        {
                            var subject = string.Format(_localizer["AttendeeReminderSubject"], remainingMinutes);
                            var body = string.Format(_localizer["AttendeeReminderBody"], attendee.FirstName, ev.Title, formattedTime, remainingMinutes);

                            await _emailService.SendEmailAsync(attendee.Email, subject, body);
                        }
                    }
                }
            }

            if (expiredEvents.Any() || upcomingEvents.Any())
            {
                await _context.SaveChangesAsync();
            }
        }
    }
}