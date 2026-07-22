using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Wishlist;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/wishlist"), Authorize]
public class WishlistController : ControllerBase
{
    private readonly WishlistService _wishlist;
    public WishlistController(WishlistService wishlist) { _wishlist = wishlist; }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetWishlist() => Ok(await _wishlist.GetWishlist(UserId));

    [HttpPost]
    public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request)
    {
        try { return Ok(await _wishlist.AddToWishlist(UserId, request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(string productId)
    {
        try { await _wishlist.RemoveFromWishlist(UserId, productId); return Ok(new { message = "Removed from wishlist" }); }
        catch (KeyNotFoundException) { return NotFound(new { error = "Item not found in wishlist" }); }
    }
}
