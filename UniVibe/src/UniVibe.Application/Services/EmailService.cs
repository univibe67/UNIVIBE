using MailKit.Net.Smtp;
using MimeKit;
using UniVibe.Application.Interfaces;

namespace UniVibe.Application.Services
{
    public class EmailService : IEmailService
    {
        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("UniVibe Destek", "univibe67@gmail.com"));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = body };

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync("univibe67@gmail.com", "otqk sifg vqse ozbw");

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
