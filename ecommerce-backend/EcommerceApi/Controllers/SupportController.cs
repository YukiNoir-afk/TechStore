using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Support;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/support"), Authorize]
public class SupportController : ControllerBase
{
    private readonly SupportService _support;

    public SupportController(SupportService support)
    {
        _support = support;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsAdmin => User.IsInRole("Admin");

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupportTicketRequest request)
        => Ok(await _support.CreateTicket(UserId, request));

    [HttpGet]
    public async Task<IActionResult> GetTickets()
    {
        if (IsAdmin) return Ok(await _support.GetAllTickets());
        return Ok(await _support.GetUserTickets(UserId));
    }

    [HttpPost("{id}/reply")]
    public async Task<IActionResult> Reply(string id, [FromBody] ReplyTicketRequest request)
    {
        try { return Ok(await _support.ReplyToTicket(id, UserId, request, IsAdmin)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [Authorize(Roles = "Admin"), HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateTicketStatusRequest request)
    {
        try { return Ok(await _support.UpdateTicketStatus(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
