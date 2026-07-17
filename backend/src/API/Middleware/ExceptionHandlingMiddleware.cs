using System.Text.Json;

namespace GymSaaS.API.Middleware;

/// <summary>
/// Catches unhandled exceptions, logs them, and returns a clean JSON string body
/// (matching the plain-string error shape the frontend already knows how to surface).
/// Outermost middleware so it wraps the whole pipeline.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception for {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize("Ocurrio un error inesperado. Intenta de nuevo.");
            await context.Response.WriteAsync(payload);
        }
    }
}
