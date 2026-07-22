using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Payments;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/payments")]
public class PaymentController : ControllerBase
{
    private readonly PaymentService _payment;
    private readonly IConfiguration _config;

    public PaymentController(PaymentService payment, IConfiguration config)
    {
        _payment = payment;
        _config = config;
    }

    /// <summary>
    /// Public endpoint — returns Stripe publishable key for frontend initialization.
    /// No auth required since the publishable key is safe to expose.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        var pk = _config["Stripe:PublishableKey"] ?? "";
        return Ok(new { publishableKey = pk });
    }

    /// <summary>
    /// Create a Stripe PaymentIntent for the given amount.
    /// Frontend calls this right before confirming payment.
    /// </summary>
    [HttpPost("create-intent"), Authorize]
    public async Task<IActionResult> CreateIntent([FromBody] CreateIntentRequest request)
    {
        try
        {
            if (request.Amount <= 0)
                return BadRequest(new { error = "Invalid amount" });

            var result = await _payment.CreatePaymentIntent(request.Amount, request.Currency);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
