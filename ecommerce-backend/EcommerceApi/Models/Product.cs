using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Price { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? OriginalPrice { get; set; }

    public string? ImageUrl { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CategoryId { get; set; } = null!;

    public int Stock { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Rating { get; set; }

    public int ReviewCount { get; set; }

    public bool OnSale { get; set; }

    public int? Discount { get; set; }

    public string? Brand { get; set; }

    public string? Model { get; set; }

    public string? Color { get; set; }

    public string? Weight { get; set; }

    public string? Warranty { get; set; }

    public string? Features { get; set; } // JSON array stored as string

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}
