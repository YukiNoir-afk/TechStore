using MongoDB.Driver;
using EcommerceApi.Models;

namespace EcommerceApi.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration config)
    {
        var client = new MongoClient(config["MongoDB:ConnectionString"]);
        _database = client.GetDatabase(config["MongoDB:DatabaseName"]);
    }

    public IMongoCollection<Product> Products => _database.GetCollection<Product>("products");
    public IMongoCollection<Category> Categories => _database.GetCollection<Category>("categories");
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Order> Orders => _database.GetCollection<Order>("orders");
    public IMongoCollection<CartItem> CartItems => _database.GetCollection<CartItem>("cartItems");
    public IMongoCollection<WishlistItem> WishlistItems => _database.GetCollection<WishlistItem>("wishlistItems");
    public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");
    public IMongoCollection<Address> Addresses => _database.GetCollection<Address>("addresses");
    public IMongoCollection<StockTransaction> StockTransactions => _database.GetCollection<StockTransaction>("stockTransactions");
    public IMongoCollection<ProductView> ProductViews => _database.GetCollection<ProductView>("productViews");
    public IMongoCollection<PromoCode> PromoCodes => _database.GetCollection<PromoCode>("promoCodes");
    public IMongoCollection<SupportTicket> SupportTickets => _database.GetCollection<SupportTicket>("supportTickets");
    public IMongoCollection<ProductQuestion> ProductQuestions => _database.GetCollection<ProductQuestion>("productQuestions");
    public IMongoCollection<ChatConversation> ChatConversations => _database.GetCollection<ChatConversation>("chatConversations");
    public IMongoCollection<ChatMessage> ChatMessages => _database.GetCollection<ChatMessage>("chatMessages");

    public async Task CreateIndexesAsync()
    {
        // User: unique email
        await Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true }));

        // Product indexes
        await Products.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Ascending(p => p.CategoryId)),
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Ascending(p => p.Name)),
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Ascending(p => p.Price)),
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Ascending(p => p.IsActive)),
            new CreateIndexModel<Product>(Builders<Product>.IndexKeys.Text(p => p.Name).Text(p => p.Description))
        });

        // Order indexes
        await Orders.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Order>(Builders<Order>.IndexKeys.Ascending(o => o.UserId)),
            new CreateIndexModel<Order>(Builders<Order>.IndexKeys.Ascending(o => o.Status)),
            new CreateIndexModel<Order>(Builders<Order>.IndexKeys.Descending(o => o.CreatedAt))
        });

        // CartItem: unique per user+product
        await CartItems.Indexes.CreateOneAsync(
            new CreateIndexModel<CartItem>(
                Builders<CartItem>.IndexKeys.Ascending(ci => ci.UserId).Ascending(ci => ci.ProductId),
                new CreateIndexOptions { Unique = true }));

        // WishlistItem: unique per user+product
        await WishlistItems.Indexes.CreateOneAsync(
            new CreateIndexModel<WishlistItem>(
                Builders<WishlistItem>.IndexKeys.Ascending(wi => wi.UserId).Ascending(wi => wi.ProductId),
                new CreateIndexOptions { Unique = true }));

        // Review: unique per user+product
        await Reviews.Indexes.CreateOneAsync(
            new CreateIndexModel<Review>(
                Builders<Review>.IndexKeys.Ascending(r => r.UserId).Ascending(r => r.ProductId),
                new CreateIndexOptions { Unique = true }));

        // Address: by user
        await Addresses.Indexes.CreateOneAsync(
            new CreateIndexModel<Address>(
                Builders<Address>.IndexKeys.Ascending(a => a.UserId)));

        // ProductView: by user + viewedAt for recommendation queries
        await ProductViews.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<ProductView>(
                Builders<ProductView>.IndexKeys.Ascending(pv => pv.UserId).Descending(pv => pv.ViewedAt)),
            new CreateIndexModel<ProductView>(
                Builders<ProductView>.IndexKeys.Ascending(pv => pv.ProductId))
        });
        // PromoCode: unique code
        await PromoCodes.Indexes.CreateOneAsync(
            new CreateIndexModel<PromoCode>(
                Builders<PromoCode>.IndexKeys.Ascending(pc => pc.Code),
                new CreateIndexOptions { Unique = true }));

        // ProductQuestion: by productId
        await ProductQuestions.Indexes.CreateOneAsync(
            new CreateIndexModel<ProductQuestion>(
                Builders<ProductQuestion>.IndexKeys.Ascending(pq => pq.ProductId)));

        // ChatConversation: by userId + status
        await ChatConversations.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<ChatConversation>(
                Builders<ChatConversation>.IndexKeys.Ascending(c => c.UserId)),
            new CreateIndexModel<ChatConversation>(
                Builders<ChatConversation>.IndexKeys.Descending(c => c.LastMessageAt))
        });

        // ChatMessage: by conversationId + createdAt
        await ChatMessages.Indexes.CreateOneAsync(
            new CreateIndexModel<ChatMessage>(
                Builders<ChatMessage>.IndexKeys.Ascending(m => m.ConversationId).Descending(m => m.CreatedAt)));
    }
}
