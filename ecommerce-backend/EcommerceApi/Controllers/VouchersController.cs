using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Vouchers;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/vouchers"), Authorize]
public class VouchersController : ControllerBase
{
    private readonly VoucherService _voucher;

    public VouchersController(VoucherService voucher) { _voucher = voucher; }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetMyVouchers()
        => Ok(await _voucher.GetMyVouchers(UserId));

    [HttpGet("catalog")]
    public async Task<IActionResult> GetVoucherCatalog()
    {
        try { return Ok(await _voucher.GetVoucherCatalog(UserId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("claim/{templateId}")]
    public async Task<IActionResult> ClaimVoucher(string templateId)
    {
        try { return Ok(await _voucher.ClaimVoucher(UserId, templateId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateVoucher([FromBody] ValidateVoucherRequest request)
    {
        try { return Ok(await _voucher.ValidateVoucher(UserId, request.Code)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
