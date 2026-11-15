using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.User.Requests
{
    public class ChangeRoleRequest
    {
        public required UserRole NewRole { get; set; }
    }
}
