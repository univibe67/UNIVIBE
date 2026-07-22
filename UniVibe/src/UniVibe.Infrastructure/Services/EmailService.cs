using Microsoft.Extensions.Configuration;
using Resend;
using UniVibe.Application.Interfaces;

namespace UniVibe.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IResend _resend;
        private readonly IConfiguration _configuration;

        public EmailService(IResend resend, IConfiguration configuration)
        {
            _resend = resend;
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var senderEmail = _configuration["Resend:SenderEmail"] ?? "onboarding@resend.dev";
            var senderName = _configuration["Resend:SenderName"] ?? "UniVibe Destek";

            var message = new EmailMessage();
            message.From = $"{senderName} <{senderEmail}>";
            message.To.Add(toEmail);
            message.Subject = subject;
            message.HtmlBody = body;

            await _resend.EmailSendAsync(message);
        }
    }
}