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
        EventStatus? status = null)
        {
            var query = _context.Events
                .AsNoTracking()
                .Include(e => e.Category)
                .Include(e => e.Attendees.Where(a => !a.IsDeleted))
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(e => e.Status == status.Value);
            }
            else if (onlyActive)
            {
                query = query.Where(e => e.IsActive &&
                                         e.EventDate >= DateTime.UtcNow &&
                                         e.Status == EventStatus.Approved);
            }

            if (categoryId.HasValue && categoryId != Guid.Empty)
            {
                query = query.Where(e => e.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var sanitized = searchTerm.Trim()
                    .Replace("\\", "\\\\")
                    .Replace("%", "\\%")
                    .Replace("_", "\\_");

                var pattern = $"%{sanitized}%";
                query = query.Where(e => EF.Functions.ILike(e.Title, pattern) ||
                                         (e.Description != null && EF.Functions.ILike(e.Description, pattern)));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(e => e.EventDate)
                .ThenBy(e => e.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<Guid>> GetJoinedEventIdsByUserAsync(List<Guid> eventIds, Guid userId)
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
                .ToListAsync();
        }

        public async Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId, bool trackChanges = false)
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

            return await query.FirstOrDefaultAsync(e => e.Id == eventId);
        }

        public async Task<List<Event>> GetAllEventsByUserIdAsync(Guid userId)
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
                .ToListAsync();
        }

        public async Task<List<Event>> GetEventsWithUsersByStatusAsync(EventStatus? status = null)
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

            return await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
        }

        public async Task<List<Event>> GetJoinedEventsByUserIdAsync(Guid userId)
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
                .ToListAsync();
        }

        public async Task<List<User>> GetParticipantsByEventIdAsync(Guid eventId)
        {
            return await _context.EventAttendees
                .AsNoTracking()
                .Where(ea => ea.EventId == eventId && !ea.IsDeleted)
                .Include(ea => ea.User)
                .Select(ea => ea.User)
                .Where(u => u != null && u.IsActive && !u.IsDeleted)
                .ToListAsync();
        }

        public async Task<bool> IsUserJoinedEventAsync(Guid eventId, Guid userId)
        {
            return await _context.EventAttendees
                .AnyAsync(ea => ea.EventId == eventId && ea.UserId == userId && !ea.IsDeleted);
        }

        public async Task AddAttendeeAsync(EventAttendee attendee)
        {
            await _context.EventAttendees.AddAsync(attendee);
        }

        public async Task<EventAttendee?> GetAttendeeAsync(Guid eventId, Guid userId)
        {
            return await _context.EventAttendees
                .FirstOrDefaultAsync(ea => ea.EventId == eventId && ea.UserId == userId && !ea.IsDeleted);
        }

        public async Task<EventAttendee?> GetLastAttendeeIncludingDeletedAsync(Guid eventId, Guid userId, bool trackChanges = true)
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
                .FirstOrDefaultAsync();
        }

        public async Task<int> CountAsync(Expression<Func<Event, bool>> predicate)
        {
            return await _context.Events.Where(predicate).CountAsync();
        }

        public void RemoveAttendee(EventAttendee attendee)
        {
            attendee.IsDeleted = true;
            attendee.IsActive = false;
            attendee.UpdatedAt = DateTime.UtcNow;
            _context.EventAttendees.Update(attendee);
        }

        public async Task RemoveAttendeesByUserIdAsync(Guid userId)
        {
            var attendees = await _context.EventAttendees
                .Where(ea => ea.UserId == userId && !ea.IsDeleted)
                .ToListAsync();

            if (attendees.Any())
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
    }
}