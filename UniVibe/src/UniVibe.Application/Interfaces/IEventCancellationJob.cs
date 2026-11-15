namespace UniVibe.Application.Interfaces
{
    public interface IEventCancellationJob
    {
        void Enqueue(Guid eventId, string reason);
    }
}
