using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniVibe.Application.DTOs.Feedback.Response
{
    public class FeedbackResponseDto
    {
        public Guid Id { get; set; }
        public string Subject { get; set; }
        public string Message { get; set; }
        public bool IsResolved { get; set; }
        public Guid UserId { get; set; }
        public string UserFullName { get; set; } // Veya UserName / Email
        public DateTime CreatedAt { get; set; }
    }
}