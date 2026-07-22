using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Wishlist;

namespace EcommerceApi.Services;

public class WishlistService
{
    private readonly MongoDbContext _db;
    public WishlistService(MongoDbContext db) { _db = db; }

    public async Task<List<WishlistItemDto>> GetWishlist(string userId)
    {
        var items = await _db.WishlistItems.Find(w => w.UserId == userId)
            .Sort(Builders<Models.WishlistItem>.Sort.Descending(w => w.AddedAt))
            .ToListAsync();

        var productIds = items.Select(w => w.ProductId).Distinct().ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id)).ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        return items.Where(w => productMap.ContainsKey(w.ProductId)).Select(w =>
        {
            var product = productMap[w.ProductId];
            return new WishlistItemDto
            {
                Id = w.Id, ProductId = w.ProductId, Name = product.Name, Price = product.Price,
                OriginalPrice = product.OriginalPrice, Image = product.ImageUrl,
                Category = categoryMap.GetValueOrDefault(product.CategoryId, ""),
                Stock = product.Stock, AddedAt = w.AddedAt
            };
        }).ToList();
    }

    public async Task<WishlistItemDto> AddToWishlist(string userId, AddToWishlistRequest request)
    {
        if (await _db.WishlistItems.Find(w => w.UserId == userId && w.ProductId == request.ProductId).AnyAsync())
            throw new InvalidOperationException("Product already in wishlist");

        var product = await _db.Products.Find(p => p.Id == request.ProductId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Product not found");
        var category = await _db.Categories.Find(c => c.Id == product.CategoryId).FirstOrDefaultAsync();

        var item = new Models.WishlistItem { UserId = userId, ProductId = request.ProductId };
        await _db.WishlistItems.InsertOneAsync(item);

        return new WishlistItemDto
        {
            Id = item.Id, ProductId = product.Id, Name = product.Name, Price = product.Price,
            OriginalPrice = product.OriginalPrice, Image = product.ImageUrl,
            Category = category?.Name ?? "", Stock = product.Stock, AddedAt = item.AddedAt
        };
    }

    public async Task RemoveFromWishlist(string userId, string productId)
    {
        var result = await _db.WishlistItems.DeleteOneAsync(w => w.UserId == userId && w.ProductId == productId);
        if (result.DeletedCount == 0) throw new KeyNotFoundException("Wishlist item not found");
    }
}
