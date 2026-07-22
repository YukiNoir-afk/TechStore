using System.Text.Json;
using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Products;

namespace EcommerceApi.Services;

public class ProductService
{
    private readonly MongoDbContext _db;
    public ProductService(MongoDbContext db) { _db = db; }

    public async Task<PagedResult<ProductListDto>> GetProducts(ProductQueryParams q)
    {
        var builder = Builders<Models.Product>.Filter;
        var filter = builder.Eq(p => p.IsActive, true);

        if (!string.IsNullOrEmpty(q.Category) && q.Category != "all")
        {
            var category = await _db.Categories.Find(c => c.Name == q.Category || c.Slug == q.Category).FirstOrDefaultAsync();
            if (category != null)
                filter &= builder.Eq(p => p.CategoryId, category.Id);
            else
                filter &= builder.Eq(p => p.CategoryId, "nonexistent"); // no match
        }

        if (q.MinPrice.HasValue) filter &= builder.Gte(p => p.Price, q.MinPrice.Value);
        if (q.MaxPrice.HasValue) filter &= builder.Lte(p => p.Price, q.MaxPrice.Value);
        if (q.InStock == true) filter &= builder.Gt(p => p.Stock, 0);
        if (!string.IsNullOrEmpty(q.Search))
        {
            var searchFilter = builder.Regex(p => p.Name, new MongoDB.Bson.BsonRegularExpression(q.Search, "i")) |
                               builder.Regex(p => p.Description, new MongoDB.Bson.BsonRegularExpression(q.Search, "i"));
            filter &= searchFilter;
        }

        var sortDef = q.SortBy switch
        {
            "price-low" => Builders<Models.Product>.Sort.Ascending(p => p.Price),
            "price-high" => Builders<Models.Product>.Sort.Descending(p => p.Price),
            "rating" => Builders<Models.Product>.Sort.Descending(p => p.Rating),
            "popular" => Builders<Models.Product>.Sort.Descending(p => p.ReviewCount),
            _ => Builders<Models.Product>.Sort.Descending(p => p.CreatedAt)
        };

        var total = await _db.Products.CountDocumentsAsync(filter);
        var products = await _db.Products.Find(filter).Sort(sortDef)
            .Skip((q.Page - 1) * q.PageSize).Limit(q.PageSize).ToListAsync();

        // Load categories for mapping
        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var items = products.Select(p => new ProductListDto
        {
            Id = p.Id, Name = p.Name, Price = p.Price, OriginalPrice = p.OriginalPrice,
            Image = p.ImageUrl, Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
            Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale, Discount = p.Discount, Stock = p.Stock
        }).ToList();

        return new PagedResult<ProductListDto> { Items = items, TotalCount = (int)total, Page = q.Page, PageSize = q.PageSize };
    }

    public async Task<ProductDto?> GetProduct(string id)
    {
        var p = await _db.Products.Find(x => x.Id == id && x.IsActive).FirstOrDefaultAsync();
        if (p == null) return null;

        var category = await _db.Categories.Find(c => c.Id == p.CategoryId).FirstOrDefaultAsync();

        return new ProductDto
        {
            Id = p.Id, Name = p.Name, Description = p.Description, Price = p.Price,
            OriginalPrice = p.OriginalPrice, Image = p.ImageUrl, Category = category?.Name ?? "",
            CategoryId = p.CategoryId, Stock = p.Stock, Rating = p.Rating, Reviews = p.ReviewCount,
            OnSale = p.OnSale, Discount = p.Discount, Brand = p.Brand, Model = p.Model,
            Color = p.Color, Weight = p.Weight, Warranty = p.Warranty,
            Features = p.Features != null ? JsonSerializer.Deserialize<List<string>>(p.Features) : null
        };
    }

    public async Task<List<ProductListDto>> GetFeaturedProducts()
    {
        var filter = Builders<Models.Product>.Filter.Eq(p => p.IsActive, true) &
            (Builders<Models.Product>.Filter.Eq(p => p.OnSale, true) |
             Builders<Models.Product>.Filter.Gte(p => p.Rating, 4.5m));

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Models.Product>.Sort.Descending(p => p.ReviewCount))
            .Limit(8).ToListAsync();

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        return products.Select(p => new ProductListDto
        {
            Id = p.Id, Name = p.Name, Price = p.Price, OriginalPrice = p.OriginalPrice,
            Image = p.ImageUrl, Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
            Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale, Discount = p.Discount, Stock = p.Stock
        }).ToList();
    }

    public async Task<List<ProductListDto>> SearchProducts(string query)
    {
        var filter = Builders<Models.Product>.Filter.Eq(p => p.IsActive, true) &
            (Builders<Models.Product>.Filter.Regex(p => p.Name, new MongoDB.Bson.BsonRegularExpression(query, "i")) |
             Builders<Models.Product>.Filter.Regex(p => p.Description, new MongoDB.Bson.BsonRegularExpression(query, "i")));

        var products = await _db.Products.Find(filter).Limit(20).ToListAsync();

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        return products.Select(p => new ProductListDto
        {
            Id = p.Id, Name = p.Name, Price = p.Price, OriginalPrice = p.OriginalPrice,
            Image = p.ImageUrl, Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
            Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale, Discount = p.Discount, Stock = p.Stock
        }).ToList();
    }

    public async Task<List<CategoryDto>> GetCategories()
    {
        var categories = await _db.Categories.Find(_ => true).ToListAsync();
        var result = new List<CategoryDto>();

        foreach (var c in categories)
        {
            var productCount = await _db.Products.CountDocumentsAsync(p => p.CategoryId == c.Id && p.IsActive);
            result.Add(new CategoryDto
            {
                Id = c.Id, Name = c.Name, Slug = c.Slug, Description = c.Description,
                ImageUrl = c.ImageUrl, ProductCount = (int)productCount
            });
        }
        return result;
    }

    public async Task<PagedResult<ProductListDto>> GetProductsByCategory(string slug, ProductQueryParams q)
    {
        q.Category = slug;
        return await GetProducts(q);
    }
}
