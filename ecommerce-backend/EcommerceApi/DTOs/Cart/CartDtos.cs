namespace EcommerceApi.DTOs.Cart;

public class CartDto
{
    public List<CartItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Shipping { get; set; }
    public decimal Total { get; set; }
    public int ItemCount { get; set; }
}

public class CartItemDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int Stock { get; set; }
    public decimal ItemTotal { get; set; }
}

public class AddToCartRequest
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}
