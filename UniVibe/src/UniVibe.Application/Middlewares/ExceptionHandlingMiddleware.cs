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
    }
}