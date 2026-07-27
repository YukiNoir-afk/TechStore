using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class Voucher
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string Code { get; set; } = string.Empty;

    public string DiscountType { get; set; } = "Percentage"; // Percentage, Fixed

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal DiscountValue { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? MinOrderValue { get; set; }

    public string TierRequired { get; set; } = "Bronze"; // Bronze, Silver, Gold, Platinum

    public DateTime ExpiryDate { get; set; }

    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }

    public string Source { get; set; } = "Admin"; // Admin, System, Catalog

    [BsonRepresentation(BsonType.ObjectId)]
    public string? TemplateId { get; set; } // Null nếu không từ catalog

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
