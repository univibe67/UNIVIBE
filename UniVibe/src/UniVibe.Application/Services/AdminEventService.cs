using AutoMapper;
using UniVibe.Application.DTOs.Event.Responses;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Enums;

namespace UniVibe.Application.Services
{
    public sealed class AdminEventService : IAdminEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminEventService(IEventRepository eventRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _eventRepository = eventRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<EventListResponse>> GetPendingEventsAsync()
        {
            var pendingEvents = await _eventRepository.GetAllAsync(e => e.Status == EventStatus.Pending);

            return _mapper.Map<List<EventListResponse>>(pendingEvents.OrderByDescending(e => e.CreatedAt)).ToList();
        }

        public async Task<List<EventListResponse>> GetAllEventsAsync()
        {
            var allEvents = await _eventRepository.GetAllWithUsersAsync();

            return _mapper.Map<List<EventListResponse>>(allEvents.OrderByDescending(e => e.CreatedAt)).ToList();
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
    }
}