namespace EcommerceApi.DTOs.Orders;

public class CreateOrderRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string Country { get; set; } = "US";
    public string ShippingMethod { get; set; } = "standard";
    public string PaymentMethod { get; set; } = "credit";
    /// <summary>Stripe PaymentIntent ID — required for credit card payments</summary>
    public string? PaymentIntentId { get; set; }
    public string? PromoCode { get; set; }
    public string? VoucherCode { get; set; }
    public List<GuestCartItemRequest>? GuestItems { get; set; }
}

public class GuestCartItemRequest
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int ItemCount { get; set; }
    public string? TrackingNumber { get; set; }
    public DateTime Date { get; set; }
}

public class OrderDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Tax { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Total { get; set; }
    public DateTime Date { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public ShippingInfoDto Shipping { get; set; } = null!;
    public TrackingInfoDto? Tracking { get; set; }
}


public class OrderItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

public class ShippingInfoDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Method { get; set; } = string.Empty;
}

public class TrackingInfoDto
{
    public string? Number { get; set; }
    public string? Carrier { get; set; }
    public string? Status { get; set; }
    public DateTime? EstimatedDelivery { get; set; }
    public List<TrackingEventDto> Events { get; set; } = new();
}

public class TrackingEventDto
{
    public DateTime Date { get; set; }
    public string? Location { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
}
