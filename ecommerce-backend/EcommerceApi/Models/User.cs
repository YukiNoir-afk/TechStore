using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string Role { get; set; } = "Customer"; // Customer, Admin

    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Loyalty and Reward points
    public int Points { get; set; } = 0;
    public string LoyaltyTier { get; set; } = "Bronze"; // Bronze, Silver, Gold, Platinum

    // Account lock
    public bool IsLocked { get; set; } = false;
    public DateTime? LockedAt { get; set; }
    public string? LockReason { get; set; }

    // Password reset
    public string? ResetPasswordToken { get; set; }
    public DateTime? ResetTokenExpiry { get; set; }
}
