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

    [HttpGet("lookup-by-phone"), AllowAnonymous]
    public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return BadRequest(new { error = "Vui lòng nhập số điện thoại" });

        try { return Ok(await _orders.GetOrderHistoryByPhone(phone)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}

