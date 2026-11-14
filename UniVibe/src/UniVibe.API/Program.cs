using Hangfire;
using Microsoft.AspNetCore.HttpOverrides;
using Serilog;
using UniVibe.API;
using UniVibe.Application;
using UniVibe.Application.Interfaces;
using UniVibe.Application.Middlewares;
using UniVibe.Infrastructure;
using UniVibe.Infrastructure.Extensions;

Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddUniVibeSerilog(builder.Configuration);
builder.Host.UseSerilog();

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddWebAPIServices(builder.Configuration);
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHangfireDashboard("/hangfire");
}

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseRequestLocalization();
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    recurringJobManager.AddOrUpdate<IEventBackgroundService>(
        "check-completed-events",
        service => service.CheckAndUpdateCompletedEventsAsync(),
        "*/15 * * * *"
    );
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();