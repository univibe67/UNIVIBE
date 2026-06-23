using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.DTOs.Auth;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register-init")]
        public async Task<IActionResult> InitiateRegistration([FromBody] RegisterInitRequest request)
        {
            // Controller sadece servisi çağırıyor, gerisine karışmıyor!
            var token = await _authService.InitiateRegistrationAsync(request.Email);
            return Ok(new { message = "Kayıt süreci başlatıldı.", token = token });
        }

        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string token)
        {
            // Servis katmanındaki o güzelim metodu çağırıyoruz
            var isValid = await _authService.VerifyTokenAsync(token);

            if (!isValid)
                return BadRequest("Token geçersiz veya süresi dolmuş.");

            return Ok(new { message = "Token doğrulandı." });
        }
    }
}
