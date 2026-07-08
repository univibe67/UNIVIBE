using Microsoft.AspNetCore.Http;
using UniVibe.Application.DTOs.Event;

namespace UniVibe.Application.Interfaces
{
    public interface IAiService
    {
        Task<AiEventExtractionDto> ExtractEventDetailsFromImageAsync(IFormFile imageFile);
    }
}
