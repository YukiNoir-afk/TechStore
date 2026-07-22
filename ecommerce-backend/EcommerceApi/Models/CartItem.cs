using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class CartItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = null!;

    public int Quantity { get; set; } = 1;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
