using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Chat;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/livechat"), Authorize]
public class LiveChatController : ControllerBase
{
    private readonly LiveChatService _chatService;

    public LiveChatController(LiveChatService chatService)
    {
        _chatService = chatService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string UserName => User.FindFirstValue(ClaimTypes.GivenName) ?? "User";
    private string UserEmail => User.FindFirstValue(ClaimTypes.Email) ?? "";
    private bool IsAdmin => User.IsInRole("Admin");

    // POST /api/v1/livechat/conversations – Start or resume a conversation
    [HttpPost("conversations")]
    public async Task<IActionResult> StartConversation()
    {
        var conversation = await _chatService.StartConversation(UserId, UserName, UserEmail);
        return Ok(conversation);
    }

    // GET /api/v1/livechat/conversations – Get conversations
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        if (IsAdmin)
            return Ok(await _chatService.GetActiveConversations());
        return Ok(await _chatService.GetUserConversations(UserId));
    }

    // GET /api/v1/livechat/conversations/{id}/messages – Get messages
    [HttpGet("conversations/{id}/messages")]
    public async Task<IActionResult> GetMessages(string id)
    {
        var messages = await _chatService.GetMessages(id);
        return Ok(messages);
    }

    // PATCH /api/v1/livechat/conversations/{id}/close – Close conversation
    [Authorize(Roles = "Admin")]
    [HttpPatch("conversations/{id}/close")]
    public async Task<IActionResult> CloseConversation(string id)
    {
        var result = await _chatService.CloseConversation(id);
        if (result == null) return NotFound(new { error = "Conversation not found" });
        return Ok(result);
    }

    // POST /api/v1/livechat/conversations/{id}/read – Mark as read
    [HttpPost("conversations/{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        await _chatService.MarkAsRead(id, IsAdmin);
        return Ok(new { message = "Marked as read" });
    }
}
