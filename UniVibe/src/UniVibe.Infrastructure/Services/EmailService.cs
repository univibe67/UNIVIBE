using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using UniVibe.Application.Interfaces;

namespace UniVibe.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var apiKey = emailSettings["Password"];
            var senderEmail = emailSettings["SenderEmail"];
            var senderName = emailSettings["SenderName"];

            var apiUrl = "https://api.brevo.com/v3/smtp/email";

            var payload = new
            {
                sender = new { name = senderName, email = senderEmail },
                to = new[] { new { email = toEmail } },
                subject = subject,
                htmlContent = body
            };

            var jsonContent = JsonSerializer.Serialize(payload);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await _httpClient.PostAsync(apiUrl, httpContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorResponse = await response.Content.ReadAsStringAsync();
                throw new Exception($"Brevo API Error ({response.StatusCode}): {errorResponse}");
            }
        }
    }
}