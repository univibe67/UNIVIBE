using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public sealed class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly IValidator<RegisterInitRequest> _registerInitValidator;
        private readonly IValidator<RegisterCompleteRequest> _registerCompleteValidator;

        public AuthController(IAuthService authService, IConfiguration configuration, IValidator<RegisterInitRequest> registerInitValidator, IValidator<RegisterCompleteRequest> registerCompleteValidator)
        {
            _authService = authService;
            _configuration = configuration;
            _registerInitValidator = registerInitValidator;
            _registerCompleteValidator = registerCompleteValidator;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpPost("register-init")]
        public async Task<IActionResult> InitiateRegistration([FromBody] RegisterInitRequest request)
        {
            var validationResult = await _registerInitValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { isSuccessful = false, errors = errors });
            }
            await _authService.InitiateRegistrationAsync(request.Email);
            return Ok(ApiResponse<string>.Success("Kayıt doğrulama linki mail adresine gönderildi."));
        }

        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string token)
        {
            var isValid = await _authService.VerifyTokenAsync(token);

            if (!isValid)
                return BadRequest(ApiResponse<string>.Fail("Token geçersiz veya süresi dolmuş."));

            return Ok(ApiResponse<string>.Success("Token doğrulandı."));
        }

        [HttpPost("complete-registration")]
        public async Task<IActionResult> CompleteRegistration([FromBody] RegisterCompleteRequest request)
        {
            var validationResult = await _registerCompleteValidator.ValidateAsync(request);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { isSuccessful = false, errors = errors });
            }
            var result = await _authService.CompleteRegistrationAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpGet("verify-redirect")]
        public IActionResult VerifyRedirect([FromQuery] string token)
        {
            string baseUrl = _configuration["ExpoBaseUrl"];
            string expoLink = $"{baseUrl}/--/register-complete?token={token}";

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
