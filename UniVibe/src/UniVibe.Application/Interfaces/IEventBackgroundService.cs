namespace UniVibe.Application.Interfaces
{
    public interface IEventBackgroundService
    {
        Task CheckAndUpdateCompletedEventsAsync();
    }
}
