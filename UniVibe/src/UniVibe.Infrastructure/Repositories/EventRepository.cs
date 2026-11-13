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
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .AsQueryable();

            if (onlyActive)
            {
                query = query.Where(e => e.IsActive &&
                                         e.EventDate >= DateTime.UtcNow &&
                                         e.Status == EventStatus.Approved);
            }
            else if (status.HasValue)
            {
                query = query.Where(e => e.Status == status.Value);
            }

            if (categoryId.HasValue && categoryId != Guid.Empty)
            {
                query = query.Where(e => e.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var pattern = $"%{searchTerm.Trim()}%";
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

        public async Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId)
        {
            return await _context.Events
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .Include(e => e.Category)
                .Include(e => e.Attendees)
                .FirstOrDefaultAsync(e => e.Id == eventId);
        }

        public async Task<Event?> GetActiveEventByUserIdAsync(Guid userId)
        {
            return await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Attendees)
                .Include(e => e.User)
                    .ThenInclude(u => u.Department)
                .FirstOrDefaultAsync(e =>
                    e.UserId == userId &&
                    e.IsDeleted == false &&
                        (
                            e.Status == EventStatus.Pending ||
                            (e.Status == EventStatus.Approved && e.EventDate > DateTime.UtcNow)
                        ));
        }

        public async Task<List<Event>> GetEventsWithUsersByStatusAsync(EventStatus? status = null)
        {
            var query = _context.Events
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
            return await _context.EventAttendees
                .Where(ea => ea.UserId == userId && !ea.IsDeleted)
                .Include(ea => ea.Event)
                    .ThenInclude(e => e.Category)
                .Include(ea => ea.Event)
                    .ThenInclude(e => e.User)
                        .ThenInclude(u => u.Department)
                .Include(ea => ea.Event)
                    .ThenInclude(e => e.Attendees)
                .Select(ea => ea.Event)
                .Where(e => !e.IsDeleted && e.IsActive)
                .OrderByDescending(e => e.EventDate)
                .ToListAsync();
        }

        public async Task<List<User>> GetParticipantsByEventIdAsync(Guid eventId)
        {
            return await _context.EventAttendees
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

        public async Task<int> CountAsync(Expression<Func<Event, bool>> predicate)
        {
            return await _context.Events.Where(predicate).CountAsync();
        }
        public void RemoveAttendee(EventAttendee attendee)
        {
            _context.EventAttendees.Remove(attendee);
        }
    }
}