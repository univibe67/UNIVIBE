using UniVibe.Application.DTOs.Event;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Interfaces.Repositories;
using UniVibe.Domain.Entities;

namespace UniVibe.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task CreateUserAsync(CreateUserDto createUserDto)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = createUserDto.Email,
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                PasswordHash = "GEÇİCİ_HASH" 
            };

            await _userRepository.AddAsync(user);
        }
    }
}
