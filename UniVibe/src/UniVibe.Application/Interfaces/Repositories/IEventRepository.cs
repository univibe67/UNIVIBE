using System.Linq.Expressions;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IEventRepository : IRepository<Event>
    {
        Task<(List<Event> Items, int TotalCount)> GetPagedEventsAsync(int pageNumber,int pageSize,bool onlyActive = true,string? searchTerm = null,Guid? categoryId = null,EventStatus? status = null, CancellationToken cancellationToken = default);

        Task<List<Guid>> GetJoinedEventIdsByUserAsync(List<Guid> eventIds,Guid userId,CancellationToken cancellationToken = default);

        Task<Event?> GetEventWithDetailsByIdAsync(Guid eventId,bool trackChanges = false,CancellationToken cancellationToken = default);

        Task<List<Event>> GetAllEventsByUserIdAsync(Guid userId,CancellationToken cancellationToken = default);

        Task<List<Event>> GetEventsWithUsersByStatusAsync(EventStatus? status = null,CancellationToken cancellationToken = default);

        Task<List<Event>> GetJoinedEventsByUserIdAsync(Guid userId,CancellationToken cancellationToken = default);

        Task<List<User>> GetParticipantsByEventIdAsync(Guid eventId,CancellationToken cancellationToken = default);

        Task<bool> IsUserJoinedEventAsync(Guid eventId,Guid userId,CancellationToken cancellationToken = default);

        Task AddAttendeeAsync(EventAttendee attendee, CancellationToken cancellationToken = default);

        Task<EventAttendee?> GetAttendeeAsync(Guid eventId,Guid userId,CancellationToken cancellationToken = default);

        Task<int> CountAsync(Expression<Func<Event, bool>> predicate,CancellationToken cancellationToken = default);

        void RemoveAttendee(EventAttendee attendee);

        Task RemoveAttendeesByUserIdAsync(Guid userId,CancellationToken cancellationToken = default);

        Task<EventAttendee?> GetLastAttendeeIncludingDeletedAsync(Guid eventId,Guid userId,bool trackChanges = true, CancellationToken cancellationToken = default);

        Task<int> GetActiveAttendeeCountAsync(Guid eventId, CancellationToken cancellationToken = default);
    }
}