using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/upload")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public UploadController(IWebHostEnvironment env) { _env = env; }

    [HttpPost("image"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Không có file nào được chọn" });

        if (file.Length > MaxFileSize)
            return BadRequest(new { error = "File quá lớn. Tối đa 5MB" });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { error = $"Định dạng file không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedExtensions)}" });

        // Create uploads directory if it doesn't exist
        var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "images");
        Directory.CreateDirectory(uploadsDir);

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the public URL
        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/images/{fileName}";

        return Ok(new { url = imageUrl, fileName });
    }
}
