namespace EcommerceApi.DTOs.Chat;

public class SendChatMessageRequest
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
}

public class ChatMessageDto
{
    public string Id { get; set; } = null!;
    public string ConversationId { get; set; } = null!;
    public string SenderId { get; set; } = null!;
    public string SenderName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChatConversationDto
{
    public string Id { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? LastMessage { get; set; }
    public int UnreadByAdmin { get; set; }
    public int UnreadByUser { get; set; }
    public DateTime LastMessageAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
