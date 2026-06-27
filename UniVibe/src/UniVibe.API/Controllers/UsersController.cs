using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.DTOs.User;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }
    }
}
