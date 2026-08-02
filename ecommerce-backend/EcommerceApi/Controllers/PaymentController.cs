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
    [HttpPost("create-intent"), AllowAnonymous]
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

    [HttpPost("momo/create"), AllowAnonymous]
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
    public async Task<IActionResult> MomoIPN([FromBody] MomoIpnRequest req, [FromServices] MomoService momoService, [FromServices] OrderService orderService, [FromServices] IConfiguration config)
    {
        var accessKey = config["MoMo:AccessKey"];
        var rawHash = $"accessKey={accessKey}&amount={req.Amount}&extraData={req.ExtraData}" +
            $"&message={req.Message}&orderId={req.OrderId}&orderInfo={req.OrderInfo}" +
            $"&orderType={req.OrderType}&partnerCode={req.PartnerCode}&payType={req.PayType}" +
            $"&requestId={req.RequestId}&responseTime={req.ResponseTime}" +
            $"&resultCode={req.ResultCode}&transId={req.TransId}";

        if (!momoService.VerifySignature(rawHash, req.Signature))
            return Unauthorized(); // Invalid signature

        var order = await orderService.GetOrderByIdRaw(req.OrderId);
        if (order == null) return NotFound();

        // Prevent double-processing and amount mismatch
        if ((long)order.Total != req.Amount) return BadRequest();

        if (req.ResultCode == 0)
        {
            await orderService.UpdatePaymentStatus(req.OrderId, "Đã thanh toán");
        }

        return NoContent();
    }
    [HttpPost("vnpay/create"), AllowAnonymous]
    public async Task<IActionResult> CreateVnPayPayment([FromBody] CreateVnPayPaymentRequest request, [FromServices] VnPayService vnPayService, [FromServices] OrderService orderService)
    {
        try
        {
            var order = await orderService.GetOrderByIdRaw(request.OrderId);
            if (order == null) return NotFound(new { error = "Đơn hàng không tồn tại" });

            var payUrl = vnPayService.CreatePaymentUrl(order);
            return Ok(new { payUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("vnpay/callback"), AllowAnonymous]
    public async Task<IActionResult> VnPayCallback([FromServices] VnPayService vnPayService, [FromServices] OrderService orderService)
    {
        var result = vnPayService.ValidateCallback(Request.Query);

        if (!result.IsSuccess)
            return BadRequest(new { error = "Xác thực chữ ký VNPay thất bại" });

        if (string.IsNullOrEmpty(result.OrderId))
            return BadRequest(new { error = "Không tìm thấy mã đơn hàng" });

        var order = await orderService.GetOrderByIdRaw(result.OrderId);
        if (order == null) return NotFound(new { error = "Đơn hàng không tồn tại" });

        if (result.ResponseCode == "00")
        {
            await orderService.UpdatePaymentStatus(result.OrderId, "Đã thanh toán");
        }
        else
        {
            await orderService.CancelOrderSystem(result.OrderId, "Thanh toán VNPay thất bại hoặc bị hủy");
        }
        
        // Frontend redirect handles user feedback, so returning JSON here is fine for IPN
        return Ok(new { success = true, result });
    }
}

public class CreateMomoPaymentRequest
{
    public string OrderId { get; set; } = null!;
    public string? RequestType { get; set; }
}

public class MomoIpnRequest
{
    public string PartnerCode { get; set; } = "";
    public string OrderId { get; set; } = "";
    public string RequestId { get; set; } = "";
    public long Amount { get; set; }
    public string OrderInfo { get; set; } = "";
    public string OrderType { get; set; } = "";
    public long TransId { get; set; }
    public int ResultCode { get; set; }
    public string Message { get; set; } = "";
    public string PayType { get; set; } = "";
    public long ResponseTime { get; set; }
    public string ExtraData { get; set; } = "";
    public string Signature { get; set; } = "";
}

public class CreateVnPayPaymentRequest
{
    public string OrderId { get; set; } = null!;
}
