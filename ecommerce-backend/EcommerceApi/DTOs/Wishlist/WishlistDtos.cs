namespace EcommerceApi.DTOs.Wishlist;

public class WishlistItemDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Stock { get; set; }
    public bool InStock => Stock > 0;
    public DateTime AddedAt { get; set; }
}

public class AddToWishlistRequest
{
    public string ProductId { get; set; } = string.Empty;
}
