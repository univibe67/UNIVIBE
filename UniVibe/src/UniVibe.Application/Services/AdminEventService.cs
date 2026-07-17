using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminEventService : IAdminEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AdminEventService(IEventRepository eventRepository, IUnitOfWork unitOfWork)
        {
            _eventRepository = eventRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<List<Event>> GetPendingEventsAsync()
        {
            var pendingEvents = await _eventRepository.GetAllAsync(e => e.Status == EventStatus.Pending);

            return pendingEvents.ToList();
        }

        public async Task<bool> ApproveEventAsync(Guid eventId)
        {
            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId);

            if (evnt == null)
                return false;

            evnt.Status = EventStatus.Approved;

            _eventRepository.Update(evnt);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RejectEventAsync(Guid eventId)
        {
            var evnt = await _eventRepository.FirstOrDefaultAsync(e => e.Id == eventId);

            if (evnt == null)
                return false;

            evnt.Status = EventStatus.Rejected;

            _eventRepository.Update(evnt);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
        public async Task<List<Event>> GetAllEventsAsync()
        {
            var allEvents = await _eventRepository.GetAllAsync();
            return allEvents.ToList();
        }
    }
}