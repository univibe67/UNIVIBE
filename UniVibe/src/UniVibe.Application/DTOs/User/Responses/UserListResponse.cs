using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.User.Responses 
{
    public class UserListResponse
    {
        public Guid Id { get; set; }
        public  string? Username { get; set; } 
        public  string? Email { get; set; } 
        public  string? FirstName { get; set; } 
        public  string? LastName { get; set; }
        public GradeLevel? Grade { get; set; }
        public string? Title { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public Gender? Gender { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? DepartmentName { get; set; }
        public string? FacultyName { get; set; }
    }
}