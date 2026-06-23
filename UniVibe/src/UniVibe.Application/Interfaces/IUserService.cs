using UniVibe.Application.DTOs.User;

namespace UniVibe.Application.Interfaces
{
    public interface IUserService
    {
        Task CreateUserAsync(CreateUserDto createUserDto);
    }
}
