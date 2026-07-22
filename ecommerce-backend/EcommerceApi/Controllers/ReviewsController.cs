using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Reviews;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/products/{productId}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly ReviewService _reviews;
    public ReviewsController(ReviewService reviews) { _reviews = reviews; }

    [HttpGet]
    public async Task<IActionResult> GetReviews(string productId)
        => Ok(await _reviews.GetProductReviews(productId));

    [Authorize, HttpGet("eligibility")]
    public async Task<IActionResult> CheckEligibility(string productId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _reviews.CheckReviewEligibility(userId, productId));
    }

    [Authorize, HttpPost]
    public async Task<IActionResult> CreateReview(string productId, [FromBody] CreateReviewRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try { return Ok(await _reviews.CreateReview(userId, productId, request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}

