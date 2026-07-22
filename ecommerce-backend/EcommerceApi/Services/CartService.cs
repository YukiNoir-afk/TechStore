using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Cart;

namespace EcommerceApi.Services;

public class CartService
{
    private readonly MongoDbContext _db;
    public CartService(MongoDbContext db) { _db = db; }

    public async Task<CartDto> GetCart(string userId)
    {
        var items = await _db.CartItems.Find(ci => ci.UserId == userId).ToListAsync();

        var productIds = items.Select(ci => ci.ProductId).Distinct().ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id)).ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var cartItems = items.Where(ci => productMap.ContainsKey(ci.ProductId)).Select(ci =>
        {
            var product = productMap[ci.ProductId];
            return new CartItemDto
            {
                Id = ci.Id, ProductId = ci.ProductId, Name = product.Name, Price = product.Price,
                Image = product.ImageUrl, Category = categoryMap.GetValueOrDefault(product.CategoryId, ""),
                Quantity = ci.Quantity, Stock = product.Stock, ItemTotal = product.Price * ci.Quantity
            };
        }).ToList();

        var subtotal = cartItems.Sum(i => i.ItemTotal);
        var tax = subtotal * 0.1m;
        var shipping = subtotal > 50 ? 0 : 10m;

        return new CartDto
        {
            Items = cartItems, Subtotal = Math.Round(subtotal, 2), Tax = Math.Round(tax, 2),
            Shipping = shipping, Total = Math.Round(subtotal + tax + shipping, 2), ItemCount = cartItems.Sum(i => i.Quantity)
        };
    }

    public async Task<CartDto> AddToCart(string userId, AddToCartRequest request)
    {
        var product = await _db.Products.Find(p => p.Id == request.ProductId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Product not found");
        if (product.Stock < request.Quantity) throw new InvalidOperationException("Insufficient stock");

        var existing = await _db.CartItems.Find(ci => ci.UserId == userId && ci.ProductId == request.ProductId).FirstOrDefaultAsync();
        if (existing != null)
        {
            await _db.CartItems.UpdateOneAsync(
                ci => ci.Id == existing.Id,
                Builders<Models.CartItem>.Update.Inc(ci => ci.Quantity, request.Quantity));
        }
        else
        {
            await _db.CartItems.InsertOneAsync(new Models.CartItem
            {
                UserId = userId, ProductId = request.ProductId, Quantity = request.Quantity
            });
        }

        return await GetCart(userId);
    }

    public async Task<CartDto> UpdateCartItem(string userId, string itemId, UpdateCartItemRequest request)
    {
        var item = await _db.CartItems.Find(ci => ci.Id == itemId && ci.UserId == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Cart item not found");

        if (request.Quantity <= 0)
            await _db.CartItems.DeleteOneAsync(ci => ci.Id == itemId);
        else
            await _db.CartItems.UpdateOneAsync(ci => ci.Id == itemId,
                Builders<Models.CartItem>.Update.Set(ci => ci.Quantity, request.Quantity));

        return await GetCart(userId);
    }

    public async Task<CartDto> RemoveFromCart(string userId, string itemId)
    {
        var result = await _db.CartItems.DeleteOneAsync(ci => ci.Id == itemId && ci.UserId == userId);
        if (result.DeletedCount == 0) throw new KeyNotFoundException("Cart item not found");
        return await GetCart(userId);
    }

    public async Task ClearCart(string userId)
    {
        await _db.CartItems.DeleteManyAsync(ci => ci.UserId == userId);
    }
}
