using Hangfire;
using UniVibe.Application.Interfaces;

namespace UniVibe.Infrastructure.Jobs
{
    public class EventCancellationJob : IEventCancellationJob
    {
        private readonly IBackgroundJobClient _backgroundJobClient;

        public EventCancellationJob(IBackgroundJobClient backgroundJobClient)
        {
            _backgroundJobClient = backgroundJobClient;
        }

        public void Enqueue(Guid eventId, string reason)
        {
            _backgroundJobClient.Enqueue<EventCancellationEmailProcessor>(
                processor => processor.ProcessAsync(eventId, reason));
        }
    }
}