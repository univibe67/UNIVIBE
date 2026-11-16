using UniVibe.Domain.Entities;

namespace UniVibe.Application.Interfaces.Repositories
{
    public interface IEventMessageRepository : IRepository<EventMessage>
    {
        Task<List<EventMessage>> GetMessagesByEventIdAsync(Guid eventId, int pageNumber, int pageSize);
        Task<EventMessage?> GetByIdWithUserAsync(Guid id);
    }
}
