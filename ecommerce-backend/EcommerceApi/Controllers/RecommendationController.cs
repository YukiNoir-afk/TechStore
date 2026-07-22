using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Recommendations;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/recommendations")]
public class RecommendationController : ControllerBase
{
    private readonly RecommendationService _recommendations;
    public RecommendationController(RecommendationService recommendations)
    {
        _recommendations = recommendations;
    }

    /// <summary>
    /// Get personalized recommendations for the logged-in user (homepage).
    /// Falls back to popular products if not authenticated or no user data.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPersonalRecommendations([FromQuery] int limit = 8)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            // Return popular/fallback for guests
            return Ok(await _recommendations.GetRelatedProducts("", null, limit));
        }
        return Ok(await _recommendations.GetPersonalRecommendations(userId, limit));
    }

    /// <summary>
    /// Get products related to a specific product (product detail page).
    /// </summary>
    [HttpGet("{productId}")]
    public async Task<IActionResult> GetRelatedProducts(string productId, [FromQuery] int limit = 8)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Ok(await _recommendations.GetRelatedProducts(productId, userId, limit));
    }

    /// <summary>
    /// Track that the current user viewed a product.
    /// </summary>
    [HttpPost("viewed"), Authorize]
    public async Task<IActionResult> TrackView([FromBody] TrackViewRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
            return BadRequest(new { error = "ProductId is required" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _recommendations.TrackProductView(userId, request.ProductId);
        return Ok(new { message = "View tracked" });
    }
}
