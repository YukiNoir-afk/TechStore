using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Cart;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/cart"), Authorize]
public class CartController : ControllerBase
{
    private readonly CartService _cart;
    public CartController(CartService cart) { _cart = cart; }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetCart() => Ok(await _cart.GetCart(UserId));

    [HttpPost("items")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
    {
        try { return Ok(await _cart.AddToCart(UserId, request)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("items/{id}")]
    public async Task<IActionResult> UpdateItem(string id, [FromBody] UpdateCartItemRequest request)
    {
        try { return Ok(await _cart.UpdateCartItem(UserId, id, request)); }
        catch (KeyNotFoundException) { return NotFound(new { error = "Cart item not found" }); }
    }

    [HttpDelete("items/{id}")]
    public async Task<IActionResult> RemoveItem(string id)
    {
        try { return Ok(await _cart.RemoveFromCart(UserId, id)); }
        catch (KeyNotFoundException) { return NotFound(new { error = "Cart item not found" }); }
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearCart() { await _cart.ClearCart(UserId); return Ok(new { message = "Cart cleared" }); }
}
