using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;
using UniVibe.Infrastructure.Persistence.Context;

namespace UniVibe.Infrastructure.Repositories
{
    public class EventRepository : Repository<Event>, IEventRepository
    {
        public EventRepository(UniVibeDbContext context) : base(context) { }

        public async Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(
            int pageNumber,
            int pageSize,
            bool onlyActive = true,
            string? searchTerm = null,
            Guid? categoryId = null,
            EventStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var filteredQuery = _context.Events
                .AsNoTracking()
                .AsQueryable();

            if (status.HasValue)
            {
                filteredQuery = filteredQuery.Where(e => e.Status == status.Value);

                if (onlyActive)
                {
                    filteredQuery = filteredQuery.Where(e => e.IsActive && e.EventDate > now);
                }
            }
            else if (onlyActive)
            {
                filteredQuery = filteredQuery.Where(e => e.IsActive &&
                                                         e.EventDate > now &&
                                                         e.Status == EventStatus.Approved);
            }

            if (categoryId.HasValue && categoryId != Guid.Empty)
            {
                filteredQuery = filteredQuery.Where(e => e.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var sanitized = searchTerm.Trim()
                    .Replace("\\", "\\\\")
                    .Replace("%", "\\%")
                    .Replace("_", "\\_");

                var pattern = $"%{sanitized}%";
                filteredQuery = filteredQuery.Where(e => EF.Functions.ILike(e.Title, pattern) ||
                                                         (e.Description != null && EF.Functions.ILike(e.Description, pattern)));
            }

            var totalCount = await filteredQuery.CountAsync(cancellationToken);

            var items = await filteredQuery
                .Include(e => e.Category)
                .Include(e => e.Attendees.Where(a => !a.IsDeleted))
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .AsSplitQuery()
                .OrderBy(e => e.EventDate)
                .ThenBy(e => e.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalCount);
        }

        public async Task<List<Guid>> GetJoinedEventIdsByUserAsync(
            List<Guid> eventIds,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            if (eventIds == null || !eventIds.Any())
                return new List<Guid>();

            return await _context.EventAttendees
                .AsNoTracking()
                .Where(a => eventIds.Contains(a.EventId) &&
                            a.UserId == userId &&
                            !a.IsDeleted)
                .Select(a => a.EventId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        public async Task<Event?> GetEventWithDetailsByIdAsync(
            Guid eventId,
            bool trackChanges = false,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Events
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .Include(e => e.Category)
                .Include(e => e.Attendees)
                .AsQueryable();

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(e => e.Id == eventId, cancellationToken);
        }

        public async Task<List<Event>> GetAllEventsByUserIdAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            const int activeOrPendingPriority = 0;
            const int pastOrClosedPriority = 1;

            return await _context.Events
                .AsNoTracking()
                .Include(e => e.Category)
                .Include(e => e.Attendees.Where(a => !a.IsDeleted))
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .Where(e => e.UserId == userId && !e.IsDeleted)
                .OrderBy(e =>
                    e.Status == EventStatus.Pending || (e.Status == EventStatus.Approved && e.EventDate > now)
                        ? activeOrPendingPriority
                        : pastOrClosedPriority)
                .ThenByDescending(e => e.EventDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<Event>> GetEventsWithUsersByStatusAsync(
            EventStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Events
                .AsNoTracking()
                .Include(e => e.User)
                .Include(e => e.Attendees)
                .Include(e => e.Category)
                .Where(e => !e.IsDeleted)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(e => e.Status == status.Value);
            }

            return await query.OrderByDescending(e => e.CreatedAt).ToListAsync(cancellationToken);
        }

        public async Task<List<Event>> GetJoinedEventsByUserIdAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Events
                .AsNoTracking()
                .Include(e => e.Category)
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .Include(e => e.Attendees)
                .Where(e => !e.IsDeleted &&
                            e.IsActive &&
                            e.Attendees.Any(a => a.UserId == userId && !a.IsDeleted))
                .OrderByDescending(e => e.EventDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<List<User>> GetParticipantsByEventIdAsync(
            Guid eventId,
            CancellationToken cancellationToken = default)
        {
            return await _context.EventAttendees
                .AsNoTracking()
                .Where(ea => ea.EventId == eventId && !ea.IsDeleted)
                .Include(ea => ea.User)
                .Select(ea => ea.User)
                .Where(u => u != null && u.IsActive && !u.IsDeleted)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> IsUserJoinedEventAsync(
            Guid eventId,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.EventAttendees
                .AnyAsync(ea => ea.EventId == eventId && ea.UserId == userId && !ea.IsDeleted, cancellationToken);
        }

        public async Task AddAttendeeAsync(EventAttendee attendee, CancellationToken cancellationToken = default)
        {
            await _context.EventAttendees.AddAsync(attendee, cancellationToken);
        }

        public async Task<EventAttendee?> GetAttendeeAsync(
            Guid eventId,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.EventAttendees
                .FirstOrDefaultAsync(ea => ea.EventId == eventId && ea.UserId == userId && !ea.IsDeleted, cancellationToken);
        }

        public async Task<EventAttendee?> GetLastAttendeeIncludingDeletedAsync(
            Guid eventId,
            Guid userId,
            bool trackChanges = true,
            CancellationToken cancellationToken = default)
        {
            var query = _context.EventAttendees
                .IgnoreQueryFilters()
                .Where(ea => ea.EventId == eventId && ea.UserId == userId);

            if (!trackChanges)
            {
                query = query.AsNoTracking();
            }

            return await query
                .OrderByDescending(ea => ea.UpdatedAt ?? ea.JoinedAt ?? ea.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<int> CountAsync(
            Expression<Func<Event, bool>> predicate,
            CancellationToken cancellationToken = default)
        {
            return await _context.Events.Where(predicate).CountAsync(cancellationToken);
        }

        public void RemoveAttendee(EventAttendee attendee)
        {
            attendee.IsDeleted = true;
            attendee.IsActive = false;
            attendee.UpdatedAt = DateTime.UtcNow;
            _context.EventAttendees.Update(attendee);
        }

        public async Task RemoveAttendeesByUserIdAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var attendees = await _context.EventAttendees
                .Where(ea => ea.UserId == userId && !ea.IsDeleted)
                .ToListAsync(cancellationToken);

            if (attendees.Count > 0)
            {
                var now = DateTime.UtcNow;
                foreach (var attendee in attendees)
                {
                    attendee.IsDeleted = true;
                    attendee.IsActive = false;
                    attendee.UpdatedAt = now;
                }
            }
        }

        public async Task<int> GetActiveAttendeeCountAsync(
            Guid eventId,
            CancellationToken cancellationToken = default)
        {
            return await _context.EventAttendees
                .AsNoTracking()
                .CountAsync(ea => ea.EventId == eventId && !ea.IsDeleted, cancellationToken);
        }
    }
}