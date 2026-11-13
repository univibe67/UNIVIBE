using System.Linq.Expressions;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IEventRepository : IRepository<Event>
    {
        Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(
            int pageNumber,
            int pageSize,
            bool onlyActive = true,
            string? searchTerm = null,
            Guid? categoryId = null,
            EventStatus? status = null);

        Task<List<Guid>> GetJoinedEventIdsByUserAsync(List<Guid> eventIds, Guid userId);
        Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId);
        Task<Event?> GetActiveEventByUserIdAsync(Guid userId);
        Task<List<Event>> GetEventsWithUsersByStatusAsync(EventStatus? status = null);
        Task<List<Event>> GetJoinedEventsByUserIdAsync(Guid userId);
        Task<List<User>> GetParticipantsByEventIdAsync(Guid eventId);
        Task<bool> IsUserJoinedEventAsync(Guid eventId, Guid userId);
        Task AddAttendeeAsync(EventAttendee attendee);
        Task<EventAttendee?> GetAttendeeAsync(Guid eventId, Guid userId);
        Task<int> CountAsync(Expression<Func<Event, bool>> predicate);
        void RemoveAttendee(EventAttendee attendee);

    }
}