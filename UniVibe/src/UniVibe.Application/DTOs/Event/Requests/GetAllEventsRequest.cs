namespace UniVibe.Application.DTOs.Event.Requests
{
    public class GetAllEventsRequest
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public bool OnlyActive { get; set; } = true;
    }
}
