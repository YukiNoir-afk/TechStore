using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Orders;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/orders"), Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orders;
    public OrdersController(OrderService orders) { _orders = orders; }

    private string? UserId => User.Identity?.IsAuthenticated == true ? User.FindFirstValue(ClaimTypes.NameIdentifier) : null;

    [HttpPost, AllowAnonymous]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try { return Ok(await _orders.CreateOrder(UserId, request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders() => Ok(await _orders.GetOrders(UserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(string id)
    {
        var order = await _orders.GetOrderDetail(UserId, id);
        return order != null ? Ok(order) : NotFound(new { error = "Order not found" });
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(string id)
    {
        try { await _orders.CancelOrder(UserId, id); return Ok(new { message = "Order cancelled successfully" }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("lookup"), AllowAnonymous]
    public async Task<IActionResult> LookupOrder([FromQuery] string phone, [FromQuery] string orderId)
    {
        if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(orderId))
            return BadRequest(new { error = "Vui lòng nhập số điện thoại và mã đơn hàng" });

        // Search the raw order first (no userId filter) to find any order with this ID
        var rawOrder = await _orders.GetOrderByIdRaw(orderId);
        if (rawOrder == null)
            return NotFound(new { error = "Không tìm thấy đơn hàng" });

        // Verify phone matches ShippingPhone
        var normalizedPhone = phone.Replace(" ", "").Replace("-", "");
        var orderPhone = rawOrder.ShippingPhone?.Replace(" ", "").Replace("-", "");
        if (string.IsNullOrEmpty(orderPhone) || orderPhone != normalizedPhone)
            return NotFound(new { error = "Không tìm thấy đơn hàng" });

        // Return full order detail
        var order = await _orders.GetOrderDetailPublic(orderId);
        return order != null ? Ok(order) : NotFound(new { error = "Không tìm thấy đơn hàng" });
    }

    [HttpGet("lookup-by-phone"), AllowAnonymous]
    public async Task<IActionResult> LookupOrderByPhone([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return BadRequest(new { error = "Vui lòng nhập số điện thoại" });

        try
        {
            var result = await _orders.GetOrderHistoryByPhone(phone);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id}/cancel-payment"), AllowAnonymous]
    public async Task<IActionResult> CancelPaymentOrder(string id)
    {
        try 
        { 
            var order = await _orders.GetOrderByIdRaw(id);
            if (order != null && (order.PaymentStatus == "Chờ thanh toán" || order.Status == "Đang xử lý"))
            {
                await _orders.CancelOrderSystem(id, "Người dùng hủy hoặc thanh toán thất bại");
                return Ok();
            }
            return BadRequest(new { error = "Không thể hủy đơn hàng này" });
        }
        catch (Exception ex) 
        { 
            return BadRequest(new { error = ex.Message }); 
        }
    }
}

