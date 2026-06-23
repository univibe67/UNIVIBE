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
            try
            {
                await _authService.InitiateRegistrationAsync(request.Email);

                return Ok(new { message = "Kayıt doğrulama linki mail adresine gönderildi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string token)
        {
            var isValid = await _authService.VerifyTokenAsync(token);

            if (!isValid)
                return BadRequest("Token geçersiz veya süresi dolmuş.");

            return Ok(new { message = "Token doğrulandı." });
        }
    }
}
