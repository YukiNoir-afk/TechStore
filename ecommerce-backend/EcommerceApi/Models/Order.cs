using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcommerceApi.Models;

public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? UserId { get; set; }

    public string Status { get; set; } = "Pending"; // Pending, Processing, Shipped, Delivered, Cancelled

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Subtotal { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Tax { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal ShippingCost { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Total { get; set; }

    // Shipping info
    public string? ShippingName { get; set; }
    public string? ShippingAddress { get; set; }
    public string? ShippingCity { get; set; }
    public string? ShippingState { get; set; }
    public string? ShippingZipCode { get; set; }
    public string? ShippingCountry { get; set; }
    public string? ShippingEmail { get; set; }
    public string? ShippingPhone { get; set; }
    public string ShippingMethod { get; set; } = "standard";

    // Tracking
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }
    public DateTime? EstimatedDelivery { get; set; }

    // Payment
    public string PaymentMethod { get; set; } = "credit";
    public string PaymentStatus { get; set; } = "Paid";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Discount and Promo
    [BsonRepresentation(BsonType.ObjectId)]
    public string? PromoCodeId { get; set; }
    
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal DiscountAmount { get; set; } = 0;

    // Embedded documents
    public List<OrderItem> Items { get; set; } = new();
    public List<OrderStatusHistory> StatusHistory { get; set; } = new();
}

public class OrderStatusHistory
{
    public string Status { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
