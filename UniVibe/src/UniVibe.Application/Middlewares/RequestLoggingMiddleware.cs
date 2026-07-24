namespace UniVibe.Application.Middlewares
{
    using Microsoft.AspNetCore.Http;
    using Microsoft.Extensions.Logging;
    using System.Diagnostics;
    using System.Security.Claims;

    namespace UniVibe.Application.Middlewares
    {
        public class RequestLoggingMiddleware
        {
            private readonly RequestDelegate _next;
            private readonly ILogger<RequestLoggingMiddleware> _logger;

            public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
            {
                _next = next;
                _logger = logger;
            }

            public async Task InvokeAsync(HttpContext context)
            {
                var stopwatch = Stopwatch.StartNew();

                var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown_IP";

                var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";

                var method = context.Request.Method;
                var path = context.Request.Path;

                try
                {
                    await _next(context);
                }
                finally
                {
                    stopwatch.Stop();
                    var elapsedMs = stopwatch.ElapsedMilliseconds;
                    var statusCode = context.Response.StatusCode;

                    if (elapsedMs > 500)
                    {
                        _logger.LogWarning(
                            "Performance Threshold Exceeded | Method: {Method} | Path: {Path} | Status: {StatusCode} | Elapsed: {ElapsedMs}ms | User: {UserId} | IP: {ClientIp}",
                            method, path, statusCode, elapsedMs, userId, clientIp);
                    }
                    else
                    {
                        _logger.LogInformation(
                            "Request Completed | Method: {Method} | Path: {Path} | Status: {StatusCode} | Elapsed: {ElapsedMs}ms | User: {UserId} | IP: {ClientIp}",
                            method, path, statusCode, elapsedMs, userId, clientIp);
                    }
                }
            }
        }
    }

}
