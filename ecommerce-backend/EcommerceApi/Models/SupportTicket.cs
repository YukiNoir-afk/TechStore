using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class SupportTicket
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    public string Status { get; set; } = "Open"; // Open, InProgress, Closed
    public string Type { get; set; } = "QA"; // QA, Warranty, Feedback
    
    public List<TicketResponse> Responses { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class TicketResponse
{
    public string Message { get; set; } = string.Empty;
    public string RespondedBy { get; set; } = "System"; // Admin or Customer UserId
    public bool IsAdmin { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
