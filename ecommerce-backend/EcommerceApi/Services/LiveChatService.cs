using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.Chat;

namespace EcommerceApi.Services;

public class LiveChatService
{
    private readonly MongoDbContext _db;

    public LiveChatService(MongoDbContext db)
    {
        _db = db;
    }

    // ── Start or resume a conversation ──────────────────────────────────
    public async Task<ChatConversationDto> StartConversation(string userId, string userName, string userEmail)
    {
        // Check if there's an active conversation for this user
        var existing = await _db.ChatConversations
            .Find(c => c.UserId == userId && c.Status == "Active")
            .FirstOrDefaultAsync();

        if (existing != null)
            return MapConversation(existing);

        var conversation = new ChatConversation
        {
            UserId = userId,
            UserName = userName,
            UserEmail = userEmail
        };

        await _db.ChatConversations.InsertOneAsync(conversation);
        return MapConversation(conversation);
    }

    // ── Send a message ──────────────────────────────────────────────────
    public async Task<ChatMessageDto> SendMessage(string conversationId, string senderId, string senderName, string message, bool isAdmin)
    {
        var chatMessage = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = senderId,
            SenderName = senderName,
            IsAdmin = isAdmin,
            Message = message
        };

        await _db.ChatMessages.InsertOneAsync(chatMessage);

        // Update conversation
        var updateBuilder = Builders<ChatConversation>.Update
            .Set(c => c.LastMessage, message.Length > 100 ? message[..100] + "..." : message)
            .Set(c => c.LastMessageAt, DateTime.UtcNow);

        if (isAdmin)
            updateBuilder = updateBuilder.Inc(c => c.UnreadByUser, 1);
        else
            updateBuilder = updateBuilder.Inc(c => c.UnreadByAdmin, 1);

        await _db.ChatConversations.UpdateOneAsync(c => c.Id == conversationId, updateBuilder);

        return MapMessage(chatMessage);
    }

    // ── Get conversation messages ───────────────────────────────────────
    public async Task<List<ChatMessageDto>> GetMessages(string conversationId, int limit = 50)
    {
        var messages = await _db.ChatMessages
            .Find(m => m.ConversationId == conversationId)
            .SortByDescending(m => m.CreatedAt)
            .Limit(limit)
            .ToListAsync();

        messages.Reverse();
        return messages.Select(MapMessage).ToList();
    }

    // ── Get active conversations (for admin) ────────────────────────────
    public async Task<List<ChatConversationDto>> GetActiveConversations()
    {
        var conversations = await _db.ChatConversations
            .Find(_ => true)
            .SortByDescending(c => c.LastMessageAt)
            .ToListAsync();

        return conversations.Select(MapConversation).ToList();
    }

    // ── Get user's conversations ────────────────────────────────────────
    public async Task<List<ChatConversationDto>> GetUserConversations(string userId)
    {
        var conversations = await _db.ChatConversations
            .Find(c => c.UserId == userId)
            .SortByDescending(c => c.LastMessageAt)
            .ToListAsync();

        return conversations.Select(MapConversation).ToList();
    }

    // ── Close conversation ──────────────────────────────────────────────
    public async Task<ChatConversationDto?> CloseConversation(string conversationId)
    {
        var update = Builders<ChatConversation>.Update
            .Set(c => c.Status, "Closed");

        var result = await _db.ChatConversations.FindOneAndUpdateAsync(
            c => c.Id == conversationId,
            update,
            new FindOneAndUpdateOptions<ChatConversation> { ReturnDocument = ReturnDocument.After }
        );

        return result != null ? MapConversation(result) : null;
    }

    // ── Mark messages as read ───────────────────────────────────────────
    public async Task MarkAsRead(string conversationId, bool isAdmin)
    {
        // Mark all messages from the other party as read
        var filter = Builders<ChatMessage>.Filter.And(
            Builders<ChatMessage>.Filter.Eq(m => m.ConversationId, conversationId),
            Builders<ChatMessage>.Filter.Eq(m => m.IsAdmin, !isAdmin),
            Builders<ChatMessage>.Filter.Eq(m => m.IsRead, false)
        );

        await _db.ChatMessages.UpdateManyAsync(filter, Builders<ChatMessage>.Update.Set(m => m.IsRead, true));

        // Reset unread count
        if (isAdmin)
            await _db.ChatConversations.UpdateOneAsync(c => c.Id == conversationId,
                Builders<ChatConversation>.Update.Set(c => c.UnreadByAdmin, 0));
        else
            await _db.ChatConversations.UpdateOneAsync(c => c.Id == conversationId,
                Builders<ChatConversation>.Update.Set(c => c.UnreadByUser, 0));
    }

    // ── Get conversation by ID ──────────────────────────────────────────
    public async Task<ChatConversationDto?> GetConversation(string conversationId)
    {
        var conversation = await _db.ChatConversations
            .Find(c => c.Id == conversationId)
            .FirstOrDefaultAsync();

        return conversation != null ? MapConversation(conversation) : null;
    }

    // ── Mappers ─────────────────────────────────────────────────────────
    private static ChatConversationDto MapConversation(ChatConversation c) => new()
    {
        Id = c.Id,
        UserId = c.UserId,
        UserName = c.UserName,
        UserEmail = c.UserEmail,
        Status = c.Status,
        LastMessage = c.LastMessage,
        UnreadByAdmin = c.UnreadByAdmin,
        UnreadByUser = c.UnreadByUser,
        LastMessageAt = c.LastMessageAt,
        CreatedAt = c.CreatedAt
    };

    private static ChatMessageDto MapMessage(ChatMessage m) => new()
    {
        Id = m.Id,
        ConversationId = m.ConversationId,
        SenderId = m.SenderId,
        SenderName = m.SenderName,
        IsAdmin = m.IsAdmin,
        Message = m.Message,
        IsRead = m.IsRead,
        CreatedAt = m.CreatedAt
    };
}
