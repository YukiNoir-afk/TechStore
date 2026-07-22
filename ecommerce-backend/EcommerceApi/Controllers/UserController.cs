using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/user"), Authorize]
public class UserController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly PromoCodeService _promo;

    public UserController(AuthService auth, PromoCodeService promo)
    {
        _auth = auth;
        _promo = promo;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("rewards")]
    public async Task<IActionResult> GetRewards()
    {
        var profile = await _auth.GetProfile(UserId);
        return Ok(new { points = profile.Points, tier = profile.LoyaltyTier });
    }

    [HttpGet("offers")]
    public async Task<IActionResult> GetOffers()
    {
        var allPromos = await _promo.GetAllPromoCodes();
        // Return only active promos for loyal customers
        var active = allPromos.Where(p => p.IsActive && p.ExpiryDate > DateTime.UtcNow).ToList();
        return Ok(active);
    }
}
