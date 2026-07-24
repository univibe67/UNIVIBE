using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
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
        private readonly IStringLocalizer<SharedResources> _localization;

        public AuthController(
            IAuthService authService,
            IConfiguration configuration,
            IStringLocalizer<SharedResources> sharedResources)
        {
            _authService = authService;
            _configuration = configuration;
            _localization = sharedResources;
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
            var message = await _authService.InitiateRegistrationAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string token)
        {
            var isValid = await _authService.VerifyTokenAsync(token);

            if (!isValid)
                return BadRequest(ApiResponse<string>.Fail(_localization["Res_Auth_TokenInvalid"].Value));

            return Ok(ApiResponse<string>.Success(_localization["Res_Auth_TokenVerified"].Value));
        }

        [HttpPost("complete-registration")]
        public async Task<IActionResult> CompleteRegistration([FromBody] RegisterCompleteRequest request)
        {
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
        public IActionResult VerifyRedirect([FromQuery] string token, [FromQuery] string? redirectUrl = null)
        {
            string target = string.IsNullOrEmpty(redirectUrl)
                ? $"{_configuration["ExpoBaseUrl"] ?? "exp://localhost:8081"}/--/register-complete"
                : redirectUrl;

            string linkToOpen = $"{target}?token={token}";

            string title = _localization["Auth_RedirectTitle"].Value ?? "UniVibe'a Yönlendiriliyorsunuz";
            string message = _localization["Auth_RedirectMessage"].Value ?? "E-posta adresiniz başarıyla doğrulandı! Kayıt işlemini tamamlamak için aşağıdaki butona tıklayın.";
            string buttonText = _localization["Auth_RedirectButton"].Value ?? "UniVibe Uygulamasını Aç";

            string currentLang = System.Globalization.CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;

            string htmlContent = $@"
        <!DOCTYPE html>
        <html lang='{currentLang}'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{title}</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 50px; background-color: #F3F4F6; color: #1F2937; }}
                .card {{ background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; }}
                h1 {{ color: #3B82F6; margin-bottom: 10px; }}
                p {{ color: #6B7280; margin-bottom: 30px; }}
                .btn {{ background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }}
            </style>
        </head>
        <body>
            <div class='card'>
                <h1>UniVibe</h1>
                <p>{message}</p>
                <a href='{linkToOpen}' class='btn'>{buttonText}</a>
            </div>
            <script>
                window.location.href = '{linkToOpen}';
            </script>
        </body>
        </html>";

            return Content(htmlContent, "text/html", System.Text.Encoding.UTF8);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var message = await _authService.ForgotPasswordAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var message = await _authService.ResetPasswordAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }
    }
}