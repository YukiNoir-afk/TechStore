using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class StockTransaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty; // "import" or "export"

    public int Quantity { get; set; }

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public string? Reason { get; set; }

    public string? Note { get; set; }

    public string CreatedBy { get; set; } = string.Empty; // admin user id

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
