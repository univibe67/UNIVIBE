using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using UniVibe.Application.Common;
using UniVibe.Application.Exceptions;

namespace UniVibe.Application.Middlewares
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IStringLocalizer<SharedResources> _localizer;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IStringLocalizer<SharedResources> localizer)
        {
            _next = next;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sistemde bir hata oluştu: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning("Yanıt zaten gönderilmeye başlandığı için ExceptionHandlingMiddleware araya giremedi.");
                return Task.CompletedTask;
            }

            context.Response.ContentType = "application/json";

            int statusCode;
            string userMessage;

            switch (exception)
            {
                case NotFoundException:
                case KeyNotFoundException:
                    statusCode = (int)HttpStatusCode.NotFound;
                    userMessage = exception.Message;
                    break;

                case UnauthorizedException:
                case UnauthorizedAccessException:
                    statusCode = (int)HttpStatusCode.Unauthorized;
                    userMessage = exception.Message;
                    break;

                case ForbiddenException:
                    statusCode = (int)HttpStatusCode.Forbidden;
                    userMessage = exception.Message;
                    break;

                case ConflictException:
                    statusCode = (int)HttpStatusCode.Conflict;
                    userMessage = exception.Message;
                    break;

                case BadRequestException:
                    statusCode = (int)HttpStatusCode.BadRequest;
                    userMessage = exception.Message;
                    break;

                case { } ex when IsDbUpdateException(ex) && IsUniqueConstraintViolation(ex):
                    statusCode = (int)HttpStatusCode.Conflict;
                    userMessage = context.Request.Path.Value?.EndsWith("/attendees", StringComparison.OrdinalIgnoreCase) == true
                        ? (_localizer["Event_AlreadyJoined"].Value ?? "Bu etkinliğe zaten katıldınız.")
                        : (_localizer["Error_Conflict"].Value ?? "Bu kayıt zaten mevcut.");
                    break;

                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;
                    userMessage = _localizer["Error_InternalServer"];
                    break;
            }

            context.Response.StatusCode = statusCode;

            var response = ApiResponse<object>.Fail(userMessage);
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var jsonResponse = JsonSerializer.Serialize(response, options);

            return context.Response.WriteAsync(jsonResponse);
        }

        private static bool IsDbUpdateException(Exception exception)
        {
            var type = exception.GetType();
            while (type != null)
            {
                if (type.Name == "DbUpdateException")
                    return true;

                type = type.BaseType;
            }

            return false;
        }

        private static bool IsUniqueConstraintViolation(Exception exception)
        {
            var current = exception;
            while (current != null)
            {
                var sqlStateProp = current.GetType().GetProperty("SqlState");
                if (sqlStateProp?.GetValue(current) is string sqlState && sqlState == "23505")
                    return true;

                if (current.Message.Contains("23505", StringComparison.OrdinalIgnoreCase) ||
                    current.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
                    current.Message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                current = current.InnerException;
            }

            return false;
        }
    }
}