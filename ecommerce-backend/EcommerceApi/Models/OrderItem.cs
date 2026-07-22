using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class OrderItem
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = null!;

    public string ProductName { get; set; } = string.Empty;

    public string? ProductImage { get; set; }

    public int Quantity { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Price { get; set; }
}
