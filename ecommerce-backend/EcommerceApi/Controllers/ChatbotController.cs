using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Chatbot;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/chatbot")]
public class ChatbotController : ControllerBase
{
    private readonly ChatbotService _chatbot;
    public ChatbotController(ChatbotService chatbot) { _chatbot = chatbot; }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { error = "Message is required" });

        // Get userId if authenticated (optional - chatbot works without login too)
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var response = await _chatbot.ProcessMessageAsync(request.Message, userId);
        return Ok(response);
    }
}
