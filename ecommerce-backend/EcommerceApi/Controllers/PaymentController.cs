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

    [HttpPost("momo/create"), Authorize]
    public async Task<IActionResult> CreateMomoPayment([FromBody] CreateMomoPaymentRequest request, [FromServices] MomoService momoService, [FromServices] OrderService orderService)
    {
        try
        {
            var order = await orderService.GetOrderByIdRaw(request.OrderId);
            if (order == null) return NotFound(new { error = "Đơn hàng không tồn tại" });

            var payUrl = await momoService.CreatePaymentAsync(order, request.RequestType ?? "captureWallet");
            return Ok(new { payUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("momo/ipn")]
    public async Task<IActionResult> MomoIPN([FromBody] dynamic payload, [FromServices] MomoService momoService, [FromServices] OrderService orderService)
    {
        // This is a simplified IPN handler. A production system must properly parse JSON and verify signature
        try
        {
            var json = System.Text.Json.JsonDocument.Parse(payload.ToString());
            var root = json.RootElement;
            var resultCode = root.GetProperty("resultCode").GetInt32();
            var orderId = root.GetProperty("orderId").GetString();

            if (resultCode == 0 && orderId != null)
            {
                await orderService.UpdatePaymentStatus(orderId, "Đã thanh toán");
            }

            return NoContent();
        }
        catch
        {
            return BadRequest();
        }
    }
}

public class CreateMomoPaymentRequest
{
    public string OrderId { get; set; } = null!;
    public string? RequestType { get; set; }
}
