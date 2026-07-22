namespace EcommerceApi.DTOs.Recommendations;

public class RecommendedProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public int Reviews { get; set; }
    public bool OnSale { get; set; }
    public int? Discount { get; set; }
    public int Stock { get; set; }
    public string Reason { get; set; } = string.Empty; // e.g. "Vì bạn thích Điện thoại"
    public string ReasonType { get; set; } = string.Empty; // category, price, collaborative, viewed, related
}

public class RecommendationResponse
{
    public List<RecommendedProductDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public bool IsPersonalized { get; set; } // true if based on user data, false if fallback
}

public class TrackViewRequest
{
    public string ProductId { get; set; } = string.Empty;
}
