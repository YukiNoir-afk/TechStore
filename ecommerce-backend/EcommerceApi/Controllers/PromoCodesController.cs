using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.PromoCodes;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/admin/promo-codes"), Authorize(Roles = "Admin")]
public class PromoCodesController : ControllerBase
{
    private readonly PromoCodeService _promo;

    public PromoCodesController(PromoCodeService promo)
    {
        _promo = promo;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePromoCodeRequest request)
    {
        try { return Ok(await _promo.CreatePromoCode(request)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _promo.GetAllPromoCodes());

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePromoCodeRequest request)
    {
        try { return Ok(await _promo.UpdatePromoCode(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try { await _promo.DeletePromoCode(id); return Ok(new { message = "Deleted successfully" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}

// Public promo code validation for customers
[ApiController, Route("api/v1/promo"), Authorize]
public class PromoValidationController : ControllerBase
{
    private readonly PromoCodeService _promo;

    public PromoValidationController(PromoCodeService promo) { _promo = promo; }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidatePromoRequest request)
    {
        try
        {
            var promo = await _promo.ValidatePromoCode(request.Code);
            return Ok(new
            {
                code = promo.Code,
                discountType = promo.DiscountType,
                discountValue = promo.DiscountValue,
                minOrderValue = promo.MinOrderValue
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class ValidatePromoRequest
{
    public string Code { get; set; } = string.Empty;
}
