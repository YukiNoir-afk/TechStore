using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class VoucherTemplate
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Title { get; set; } = string.Empty; // "Giảm 10% đơn hàng"

    public string Description { get; set; } = string.Empty; // Mô tả chi tiết

    public string CodePrefix { get; set; } = string.Empty; // Prefix cho code khi claim

    public string DiscountType { get; set; } = "Percentage"; // Percentage, Fixed

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal DiscountValue { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? MinOrderValue { get; set; }

    public string TierRequired { get; set; } = "Bronze"; // Bronze, Silver, Gold, Platinum

    public DateTime ExpiryDate { get; set; }

    public int MaxClaims { get; set; } = 0; // 0 = unlimited

    public int ClaimedCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
