using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class PromoCode
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Code { get; set; } = string.Empty; // e.g., SUMMER20
    public string DiscountType { get; set; } = "Percentage"; // Percentage, Fixed
    
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal DiscountValue { get; set; }
    
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? MinOrderValue { get; set; }

    public DateTime ExpiryDate { get; set; }
    public int UsageLimit { get; set; } = 0; // 0 means unlimited
    public int UsedCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
