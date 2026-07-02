using Microsoft.AspNetCore.Http;

namespace UniVibe.Application.Interfaces
{
    public interface IImageService
    {
        Task<(string Url, string PublicId)> UploadImageAsync(IFormFile file, string folderName);

        Task<bool> DeleteImageAsync(string publicId);
    }
}
