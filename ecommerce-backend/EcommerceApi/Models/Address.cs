using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class Address
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string Street { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string ZipCode { get; set; } = string.Empty;

    public string Country { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}
