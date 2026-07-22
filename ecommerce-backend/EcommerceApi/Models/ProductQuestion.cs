using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class ProductQuestion
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string Question { get; set; } = string.Empty;

    public List<QuestionAnswer> Answers { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class QuestionAnswer
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    public string Answer { get; set; } = string.Empty;
    public bool IsAdmin { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
