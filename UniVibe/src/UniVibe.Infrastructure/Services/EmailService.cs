using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;
using UniVibe.Application.Interfaces;

namespace UniVibe.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(
                emailSettings["SenderName"],
                emailSettings["SenderEmail"]
            ));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = body };

            using var smtp = new SmtpClient();

            smtp.Timeout = 10000;

            try
            {
                await smtp.ConnectAsync(
                    emailSettings["Host"],
                    int.Parse(emailSettings["Port"]),
                    MailKit.Security.SecureSocketOptions.StartTls
                );

                await smtp.AuthenticateAsync(
                    emailSettings["SenderEmail"],
                    emailSettings["Password"]
                );

                await smtp.SendAsync(email);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Mail Gönderme Hatası: {ex.Message}");
                throw new Exception($"E-posta gönderilemedi: {ex.Message}");
            }
            finally
            {
                if (smtp.IsConnected)
                {
                    await smtp.DisconnectAsync(true);
                }
            }
        }
    }
}