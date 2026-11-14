using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Localization;
using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Encodings.Web;
using UniVibe.Application.Common;
using UniVibe.Application.DTOs.Auth.Requests;
using UniVibe.Application.DTOs.Auth.Responses;
using UniVibe.Application.Interfaces;

namespace UniVibe.API.Controllers
{
    [Route("api/auth")]
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
        [EnableRateLimiting("LoginLimit")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpPost("register/init")]
        [EnableRateLimiting("StrictAuthLimit")]
        public async Task<IActionResult> InitiateRegistration([FromBody] RegisterInitRequest request)
        {
            var message = await _authService.InitiateRegistrationAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpGet("tokens/verification")]
        public async Task<IActionResult> VerifyToken([FromQuery] string token)
        {
            var isValid = await _authService.VerifyTokenAsync(token);

            if (!isValid)
                return BadRequest(ApiResponse<string>.Fail(_localization["Res_Auth_TokenInvalid"].Value));

            return Ok(ApiResponse<string>.Success(_localization["Res_Auth_TokenVerified"].Value));
        }

        [HttpPost("register/completion")]
        public async Task<IActionResult> CompleteRegistration([FromBody] RegisterCompleteRequest request)
        {
            var result = await _authService.CompleteRegistrationAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpPost("tokens/refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request);
            return Ok(ApiResponse<LoginResponse>.Success(result));
        }

        [HttpGet("verification/redirect")]
        public IActionResult VerifyRedirect([FromQuery] string token)
        {
            string expoBaseUrl = _configuration["ExpoBaseUrl"] ?? "exp://localhost:8081";
            string linkToOpen = $"{expoBaseUrl}/--/register-complete?token={Uri.EscapeDataString(token)}";

            string title = _localization["Auth_RedirectTitle"].Value ?? "UniVibe'a Yönlendiriliyorsunuz";
            string message = _localization["Auth_RedirectMessage"].Value ?? "E-posta adresiniz başarıyla doğrulandı! Kayıt işlemini tamamlamak için aşağıdaki butona tıklayın.";
            string buttonText = _localization["Auth_RedirectButton"].Value ?? "UniVibe Uygulamasını Aç";
            string currentLang = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;

            string htmlContent = GenerateRedirectHtml(linkToOpen, title, message, buttonText, currentLang);

            return Content(htmlContent, "text/html", Encoding.UTF8);
        }

        [HttpPost("password/forgot")]
        [EnableRateLimiting("StrictAuthLimit")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var message = await _authService.ForgotPasswordAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }

        [HttpPost("password/reset")]
        [EnableRateLimiting("StrictAuthLimit")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var message = await _authService.ResetPasswordAsync(request);
            return Ok(ApiResponse<string>.Success(message));
        }
        private string GenerateRedirectHtml(string link, string title, string message, string buttonText, string lang)
        {
            string safeLink = JavaScriptEncoder.Default.Encode(link);
            string safeHtmlLink = WebUtility.HtmlEncode(link);

            return $@"
        <!DOCTYPE html>
        <html lang='{lang}'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{WebUtility.HtmlEncode(title)}</title>
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
                <p>{WebUtility.HtmlEncode(message)}</p>
                <a href='{safeHtmlLink}' class='btn'>{WebUtility.HtmlEncode(buttonText)}</a>
            </div>
            <script>
                window.location.href = '{safeLink}';
            </script>
        </body>
        </html>";
        }
    }
}