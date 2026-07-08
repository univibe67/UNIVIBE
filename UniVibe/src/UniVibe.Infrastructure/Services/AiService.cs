using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;
using UniVibe.Application.DTOs.Event;
using UniVibe.Application.Interfaces;

namespace UniVibe.Infrastructure.Services
{
    public class AiService : IAiService
    {
        private readonly IConfiguration _configuration;

        public AiService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<AiEventExtractionDto> ExtractEventDetailsFromImageAsync(IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new Exception("Lütfen geçerli bir afiş görseli yükleyin.");

            using var memoryStream = new MemoryStream();
            await imageFile.CopyToAsync(memoryStream);
            var imageBytes = memoryStream.ToArray();
            var base64Image = Convert.ToBase64String(imageBytes);
            var mimeType = imageFile.ContentType;

            var apiKey = _configuration["GeminiConfig:ApiKey"];

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var systemInstruction = @"Sen bir üniversite kampüs etkinlik asistanısın. Gönderilen afiş görselini incele ve detayları çıkar. 
            Tarihi KESİNLİKLE 'yyyy-MM-ddTHH:mm:ss' formatında (ISO 8601) ver. Bulamazsan null gönder.
            Konum yoksa 'Belirtilmemiş' yaz. Çıktıyı SADECE JSON olarak ver:
            { ""title"": ""..."", ""description"": ""..."", ""location"": ""..."", ""eventDate"": ""yyyy-MM-ddTHH:mm:ss"" }";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = systemInstruction },
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = mimeType,
                                    data = base64Image
                                }
                            }
                        }
                    }
                }
            };

            using var client = new HttpClient();
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception("Bir hata ile karşılaşıldı. Lütfen tekrar deneyiniz");

            using var doc = JsonDocument.Parse(responseString);
            var aiResponseText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (!string.IsNullOrEmpty(aiResponseText))
                aiResponseText = aiResponseText.Replace("```json", "").Replace("```", "").Trim();

            var extractedData = JsonSerializer.Deserialize<AiEventExtractionDto>(aiResponseText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return extractedData ?? new AiEventExtractionDto();
        }
    }
}
