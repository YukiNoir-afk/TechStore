using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Admin;
using EcommerceApi.DTOs.Support;
using EcommerceApi.DTOs.Vouchers;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/admin"), Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _admin;
    private readonly SupportService _support;
    private readonly VoucherService _voucher;
    public AdminController(AdminService admin, SupportService support, VoucherService voucher) { _admin = admin; _support = support; _voucher = voucher; }

    private string AdminUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ── Dashboard ─────────────────────────────────────────────────────────
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => Ok(await _admin.GetDashboardStats());

    // ── Revenue Report ───────────────────────────────────────────────────
    [HttpGet("revenue-report")]
    public async Task<IActionResult> GetRevenueReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? paymentMethod = null)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        return Ok(await _admin.GetRevenueReport(fromDate, toDate, paymentMethod));
    }

    // ── Orders ────────────────────────────────────────────────────────────
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        => Ok(await _admin.GetAllOrders(status));

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusRequest request)
    {
        try { return Ok(await _admin.UpdateOrderStatus(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // ── Products ──────────────────────────────────────────────────────────
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] string? search = null)
        => Ok(await _admin.GetAllProducts(search));

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        try { return Ok(await _admin.CreateProduct(request)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] CreateProductRequest request)
    {
        try { return Ok(await _admin.UpdateProduct(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPatch("products/{id}/toggle")]
    public async Task<IActionResult> ToggleProduct(string id)
    {
        try { await _admin.ToggleProductActive(id); return Ok(new { message = "Product visibility toggled" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // ── Users ─────────────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
        => Ok(await _admin.GetAllUsers());

    [HttpPut("users/{id}/lock")]
    public async Task<IActionResult> LockUser(string id, [FromBody] LockUserRequest request)
    {
        try { await _admin.LockUser(id, request.Reason); return Ok(new { message = "Đã khóa tài khoản" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("users/{id}/unlock")]
    public async Task<IActionResult> UnlockUser(string id)
    {
        try { await _admin.UnlockUser(id); return Ok(new { message = "Đã mở khóa tài khoản" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        try { await _admin.DeleteUser(id); return Ok(new { message = "Đã xóa tài khoản" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("users/{id}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(string id, [FromBody] AdminResetPasswordRequest request)
    {
        try { await _admin.AdminResetPassword(id, request.NewPassword); return Ok(new { message = "Đã đổi mật khẩu thành công" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Order History by Phone ────────────────────────────────────────────
    [HttpGet("orders/by-phone")]
    public async Task<IActionResult> GetOrdersByPhone([FromQuery] string phone)
    {
        try { return Ok(await _admin.GetOrderHistoryByPhone(phone)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
    // ── Categories ─────────────────────────────────────────────────────────
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => Ok(await _admin.GetAllCategories());

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        try { return Ok(await _admin.CreateCategory(request)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] CreateCategoryRequest request)
    {
        try { return Ok(await _admin.UpdateCategory(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        try { await _admin.DeleteCategory(id); return Ok(new { message = "Category deleted" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Inventory ──────────────────────────────────────────────────────────
    [HttpGet("stock-transactions")]
    public async Task<IActionResult> GetStockTransactions([FromQuery] string? productId = null, [FromQuery] string? type = null)
        => Ok(await _admin.GetStockTransactions(productId, type));

    [HttpPost("stock-transactions")]
    public async Task<IActionResult> CreateStockTransaction([FromBody] CreateStockTransactionRequest request)
    {
        try { return Ok(await _admin.CreateStockTransaction(AdminUserId, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Customer Care: Reviews ────────────────────────────────────────────
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews()
        => Ok(await _admin.GetAllReviews());

    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(string id)
    {
        try { await _admin.DeleteReview(id); return Ok(new { message = "Review deleted" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // ── Customer Care: Support Tickets ─────────────────────────────────────
    [HttpGet("support-tickets")]
    public async Task<IActionResult> GetSupportTickets([FromQuery] string? status = null, [FromQuery] string? type = null)
        => Ok(await _admin.GetAllSupportTickets(status, type));

    [HttpPost("support-tickets/{id}/reply")]
    public async Task<IActionResult> ReplyToTicket(string id, [FromBody] ReplyTicketRequest request)
    {
        try { return Ok(await _support.ReplyToTicket(id, AdminUserId, request, true)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPatch("support-tickets/{id}/status")]
    public async Task<IActionResult> UpdateTicketStatus(string id, [FromBody] UpdateTicketStatusRequest request)
    {
        try { return Ok(await _support.UpdateTicketStatus(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    // ── Vouchers ──────────────────────────────────────────────────────────
    [HttpPost("vouchers/give")]
    public async Task<IActionResult> GiveVoucher([FromBody] AdminGiveVoucherRequest request)
    {
        try { return Ok(await _voucher.GiveVoucher(request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("vouchers/give-tier")]
    public async Task<IActionResult> GiveVoucherToTier([FromBody] AdminGiveVoucherToTierRequest request)
    {
        try
        {
            var count = await _voucher.GiveVoucherToTier(request);
            return Ok(new { message = $"Đã tặng voucher cho {count} khách hàng bậc {request.Tier}" });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Voucher Templates ────────────────────────────────────────────────
    [HttpGet("voucher-templates")]
    public async Task<IActionResult> GetVoucherTemplates()
        => Ok(await _voucher.GetAllTemplates());

    [HttpPost("voucher-templates")]
    public async Task<IActionResult> CreateVoucherTemplate([FromBody] CreateVoucherTemplateRequest request)
    {
        try { return Ok(await _voucher.CreateVoucherTemplate(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPatch("voucher-templates/{id}/toggle")]
    public async Task<IActionResult> ToggleVoucherTemplate(string id)
    {
        try { await _voucher.ToggleTemplate(id); return Ok(new { message = "Đã cập nhật trạng thái voucher template" }); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
