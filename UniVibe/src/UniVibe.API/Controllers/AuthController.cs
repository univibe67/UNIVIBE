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


        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
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
                return BadRequest(new { message = "Token geçersiz veya süresi dolmuş." });

            return Ok(new { message = "Token doğrulandı.", token = token });
        }

        [HttpPost("complete-registration")]
        public async Task<IActionResult> CompleteRegistration([FromBody] RegisterCompleteRequest request)
        {
            var result = await _authService.CompleteRegistrationAsync(request);
            return Ok(result); 
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request);

            return Ok(result);
        }
        [HttpGet("verify-redirect")]
        public IActionResult VerifyRedirect([FromQuery] string token)
        {
            string expoLink = $"exp://192.168.1.110:8081/--/register-complete?token={token}";

            string htmlContent = $@"
                <!DOCTYPE html>
                <html lang='tr'>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>UniVibe'a Yönlendiriliyorsunuz</title>
                    <style>
                        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 50px; backgroundColor: #F3F4F6; color: #1F2937; }}
                        .card {{ background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; }}
                        h1 {{ color: #3B82F6; margin-bottom: 10px; }}
                        p {{ color: #6B7280; margin-bottom: 30px; }}
                        .btn {{ background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }}
                    </style>
                </head>
                <body>
                    <div class='card'>
                        <h1>UniVibe</h1>
                        <p>E-posta adresiniz başarıyla doğrulandı! Kayıt işlemini tamamlamak için aşağıdaki butona tıklayın.</p>
                        <a href='{expoLink}' class='btn'>UniVibe Uygulamasını Aç</a>
                    </div>
                    <script>
                        // Sayfa açılır açılmaz uygulamayı otomatik tetiklemeyi de deniyoruz!
                        window.location.href = '{expoLink}';
                    </script>
                </body>
                </html>";

            return Content(htmlContent, "text/html", System.Text.Encoding.UTF8);
        }
    }
}
