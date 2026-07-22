using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using EcommerceApi.Services;

namespace EcommerceApi.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly LiveChatService _chatService;

    public ChatHub(LiveChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);

        if (userId != null)
        {
            // Add user to their personal group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // If admin, also add to Admins group
            if (role == "Admin")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);

        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

            if (role == "Admin")
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    // ── User sends message to admin ─────────────────────────────────────
    public async Task SendMessageToAdmin(string conversationId, string message)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = Context.User?.FindFirstValue(ClaimTypes.GivenName) ?? "User";

        if (userId == null) return;

        var chatMessage = await _chatService.SendMessage(conversationId, userId, userName, message, false);

        // Send to all admins
        await Clients.Group("Admins").SendAsync("ReceiveMessage", chatMessage);

        // Also send back to sender for confirmation
        await Clients.Caller.SendAsync("ReceiveMessage", chatMessage);
    }

    // ── Admin sends message to user ─────────────────────────────────────
    public async Task SendMessageToUser(string conversationId, string message)
    {
        var adminId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var adminName = Context.User?.FindFirstValue(ClaimTypes.GivenName) ?? "Admin";
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);

        if (adminId == null || role != "Admin") return;

        var chatMessage = await _chatService.SendMessage(conversationId, adminId, adminName, message, true);

        // Get conversation to find user
        var conversation = await _chatService.GetConversation(conversationId);
        if (conversation != null)
        {
            // Send to the specific user
            await Clients.Group($"user_{conversation.UserId}").SendAsync("ReceiveMessage", chatMessage);
        }

        // Also send to all admins so they can see the reply
        await Clients.Group("Admins").SendAsync("ReceiveMessage", chatMessage);
    }

    // ── Join a conversation (for read receipts) ─────────────────────────
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");

        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        var isAdmin = role == "Admin";
        await _chatService.MarkAsRead(conversationId, isAdmin);
    }

    // ── Typing indicator ────────────────────────────────────────────────
    public async Task Typing(string conversationId, bool isTyping)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        var isAdmin = role == "Admin";

        if (isAdmin)
        {
            // Notify user that admin is typing
            var conversation = await _chatService.GetConversation(conversationId);
            if (conversation != null)
            {
                await Clients.Group($"user_{conversation.UserId}")
                    .SendAsync("UserTyping", conversationId, isTyping, true);
            }
        }
        else
        {
            // Notify admins that user is typing
            await Clients.Group("Admins")
                .SendAsync("UserTyping", conversationId, isTyping, false);
        }
    }

    // ── Close conversation ──────────────────────────────────────────────
    public async Task CloseConversation(string conversationId)
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);
        if (role != "Admin") return;

        var conversation = await _chatService.CloseConversation(conversationId);
        if (conversation != null)
        {
            // Notify user
            await Clients.Group($"user_{conversation.UserId}")
                .SendAsync("ConversationClosed", conversationId);

            // Notify admins
            await Clients.Group("Admins")
                .SendAsync("ConversationClosed", conversationId);
        }
    }
}
