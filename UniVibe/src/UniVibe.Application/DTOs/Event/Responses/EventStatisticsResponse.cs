namespace UniVibe.Application.DTOs.Event.Responses
{
    public class EventStatisticsResponse
    {
        public int TotalCreatedEvents { get; set; }
        public int ActiveEvents { get; set; }
        public int PendingEvents { get; set; }
    }
}
