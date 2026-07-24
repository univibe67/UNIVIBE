using Serilog;
using UniVibe.API.Extensions;
using UniVibe.Application;
using UniVibe.Application.Middlewares;
using UniVibe.Application.Middlewares.UniVibe.Application.Middlewares;
using UniVibe.Infrastructure;
using UniVibe.Infrastructure.Extensions;

Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddUniVibeSerilog(builder.Configuration);
builder.Host.UseSerilog();

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddWebAPIServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseRequestLocalization();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();