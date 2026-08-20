using UniVibe.Domain.Enums;

namespace UniVibe.Application.DTOs.User.Requests
{
    public class ChangeRoleRequest
    {
        public UserRole NewRole { get; set; }
    }
}
