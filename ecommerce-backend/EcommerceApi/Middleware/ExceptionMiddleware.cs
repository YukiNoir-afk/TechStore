using System.Net;
using System.Text.Json;

namespace EcommerceApi.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            System.IO.File.AppendAllText(@"D:\Thuong Mai Dien Tu\error.log", ex.ToString() + Environment.NewLine);
            context.Response.ContentType = "application/json";

            var (status, message) = ex switch
            {
                KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ex.Message),
                InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
                _ => (HttpStatusCode.InternalServerError, "Đã có lỗi xảy ra. Vui lòng thử lại sau.")
            };

            context.Response.StatusCode = (int)status;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = message,
                statusCode = (int)status
            }));
        }
    }
}
