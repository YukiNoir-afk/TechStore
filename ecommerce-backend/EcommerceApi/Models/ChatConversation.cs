using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class ChatConversation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;

    public string Status { get; set; } = "Active"; // Active, Closed

    public string? LastMessage { get; set; }
    public int UnreadByAdmin { get; set; } = 0;
    public int UnreadByUser { get; set; } = 0;

    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
