using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ConversationId { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SenderId { get; set; } = null!;

    public string SenderName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
