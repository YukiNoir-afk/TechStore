namespace EcommerceApi.DTOs.Products;

public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public int Stock { get; set; }
    public decimal Rating { get; set; }
    public int Reviews { get; set; }
    public bool OnSale { get; set; }
    public int? Discount { get; set; }
    public bool InStock => Stock > 0;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? Weight { get; set; }
    public string? Warranty { get; set; }
    public List<string>? Features { get; set; }
}

public class ProductListDto
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
}

public class CategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int ProductCount { get; set; }
}

public class ProductQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
    public string? Category { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SortBy { get; set; } = "newest";
    public bool? InStock { get; set; }
    public string? Search { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
