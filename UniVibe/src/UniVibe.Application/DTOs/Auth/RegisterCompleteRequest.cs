using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.Auth;

public class RegisterCompleteRequest
{
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public GradeLevel Grade { get; set; }         
}
