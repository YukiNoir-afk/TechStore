using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Recommendations;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class RecommendationService
{
    private readonly MongoDbContext _db;
    public RecommendationService(MongoDbContext db) { _db = db; }

    /// <summary>
    /// Get personalized recommendations for the homepage "Dành riêng cho bạn" section.
    /// Combines 5 strategies: category affinity, price range, collaborative filtering,
    /// recently viewed, and popular products.
    /// </summary>
    public async Task<RecommendationResponse> GetPersonalRecommendations(string userId, int limit = 8)
    {
        // Gather user behavior data in parallel
        var ordersTask = _db.Orders.Find(o => o.UserId == userId)
            .Sort(Builders<Order>.Sort.Descending(o => o.CreatedAt))
            .Limit(20).ToListAsync();

        var wishlistTask = _db.WishlistItems.Find(w => w.UserId == userId).ToListAsync();
        var cartTask = _db.CartItems.Find(ci => ci.UserId == userId).ToListAsync();
        var reviewsTask = _db.Reviews.Find(r => r.UserId == userId).ToListAsync();
        var viewsTask = _db.ProductViews.Find(pv => pv.UserId == userId)
            .Sort(Builders<ProductView>.Sort.Descending(pv => pv.ViewedAt))
            .Limit(30).ToListAsync();

        await Task.WhenAll(ordersTask, wishlistTask, cartTask, reviewsTask, viewsTask);

        var orders = ordersTask.Result;
        var wishlist = wishlistTask.Result;
        var cart = cartTask.Result;
        var reviews = reviewsTask.Result;
        var views = viewsTask.Result;

        // Collect all product IDs the user has already purchased
        var purchasedProductIds = orders
            .SelectMany(o => o.Items.Select(i => i.ProductId))
            .Distinct().ToHashSet();

        // Check if user has enough data for personalization
        bool hasData = purchasedProductIds.Count > 0 || wishlist.Count > 0 ||
                       cart.Count > 0 || reviews.Count > 0 || views.Count > 0;

        if (!hasData)
            return await GetFallbackRecommendations(limit);

        // ═══ Run all strategies in parallel ═══
        var scoredProducts = new Dictionary<string, ScoredProduct>();

        // Strategy 1: Category Affinity (weight: 30%)
        var categoryProducts = await GetCategoryAffinityProducts(
            orders, wishlist, cart, reviews, purchasedProductIds);
        MergeScores(scoredProducts, categoryProducts, 0.30);

        // Strategy 2: Price Range Match (weight: 20%)
        var priceProducts = await GetPriceRangeProducts(orders, purchasedProductIds);
        MergeScores(scoredProducts, priceProducts, 0.20);

        // Strategy 3: Collaborative Filtering (weight: 25%)
        var collabProducts = await GetCollaborativeProducts(
            purchasedProductIds, userId);
        MergeScores(scoredProducts, collabProducts, 0.25);

        // Strategy 4: Recently Viewed but not purchased (weight: 10%)
        var viewedProducts = await GetRecentlyViewedProducts(views, purchasedProductIds);
        MergeScores(scoredProducts, viewedProducts, 0.10);

        // Strategy 5: Fill with popular products (weight: 15%)
        var popularProducts = await GetPopularProducts(purchasedProductIds);
        MergeScores(scoredProducts, popularProducts, 0.15);

        // ═══ Sort by score and take top N ═══
        var topProducts = scoredProducts.Values
            .OrderByDescending(sp => sp.Score)
            .Take(limit)
            .ToList();

        if (topProducts.Count == 0)
            return await GetFallbackRecommendations(limit);

        // Load full product data
        var productIds = topProducts.Select(sp => sp.ProductId).ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id) && p.IsActive)
            .ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        // Load categories
        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var items = topProducts
            .Where(sp => productMap.ContainsKey(sp.ProductId))
            .Select(sp =>
            {
                var p = productMap[sp.ProductId];
                return new RecommendedProductDto
                {
                    Id = p.Id, Name = p.Name, Price = p.Price,
                    OriginalPrice = p.OriginalPrice, Image = p.ImageUrl,
                    Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
                    Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale,
                    Discount = p.Discount, Stock = p.Stock,
                    Reason = sp.Reason, ReasonType = sp.ReasonType
                };
            }).ToList();

        return new RecommendationResponse
        {
            Items = items,
            TotalCount = items.Count,
            IsPersonalized = true
        };
    }

    /// <summary>
    /// Get related products for a specific product page.
    /// Uses same category, similar price range, same brand.
    /// </summary>
    public async Task<RecommendationResponse> GetRelatedProducts(
        string productId, string? userId, int limit = 8)
    {
        var product = await _db.Products.Find(p => p.Id == productId).FirstOrDefaultAsync();
        if (product == null)
            return new RecommendationResponse();

        // Products already purchased by user (to exclude)
        var purchasedIds = new HashSet<string>();
        if (!string.IsNullOrEmpty(userId))
        {
            var orders = await _db.Orders.Find(o => o.UserId == userId).ToListAsync();
            purchasedIds = orders.SelectMany(o => o.Items.Select(i => i.ProductId))
                .Distinct().ToHashSet();
        }

        var scoredProducts = new Dictionary<string, ScoredProduct>();

        // Same category products
        var sameCategoryFilter = Builders<Product>.Filter.Eq(p => p.IsActive, true) &
            Builders<Product>.Filter.Eq(p => p.CategoryId, product.CategoryId) &
            Builders<Product>.Filter.Ne(p => p.Id, productId);

        var sameCategoryProducts = await _db.Products.Find(sameCategoryFilter)
            .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
            .Limit(limit).ToListAsync();

        foreach (var p in sameCategoryProducts.Where(p => !purchasedIds.Contains(p.Id)))
        {
            var categoryName = (await _db.Categories.Find(c => c.Id == p.CategoryId)
                .FirstOrDefaultAsync())?.Name ?? "";
            scoredProducts[p.Id] = new ScoredProduct
            {
                ProductId = p.Id, Score = 0.40,
                Reason = $"Cùng danh mục {categoryName}",
                ReasonType = "related"
            };
        }

        // Similar price range (±30%)
        var minPrice = product.Price * 0.7m;
        var maxPrice = product.Price * 1.3m;
        var priceFilter = Builders<Product>.Filter.Eq(p => p.IsActive, true) &
            Builders<Product>.Filter.Gte(p => p.Price, minPrice) &
            Builders<Product>.Filter.Lte(p => p.Price, maxPrice) &
            Builders<Product>.Filter.Ne(p => p.Id, productId);

        var priceProducts = await _db.Products.Find(priceFilter)
            .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
            .Limit(limit).ToListAsync();

        foreach (var p in priceProducts.Where(p => !purchasedIds.Contains(p.Id)))
        {
            if (scoredProducts.ContainsKey(p.Id))
                scoredProducts[p.Id].Score += 0.20;
            else
                scoredProducts[p.Id] = new ScoredProduct
                {
                    ProductId = p.Id, Score = 0.20,
                    Reason = "Tầm giá tương tự",
                    ReasonType = "price"
                };
        }

        // Same brand (if available)
        if (!string.IsNullOrEmpty(product.Brand))
        {
            var brandFilter = Builders<Product>.Filter.Eq(p => p.IsActive, true) &
                Builders<Product>.Filter.Eq(p => p.Brand, product.Brand) &
                Builders<Product>.Filter.Ne(p => p.Id, productId);

            var brandProducts = await _db.Products.Find(brandFilter)
                .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
                .Limit(4).ToListAsync();

            foreach (var p in brandProducts.Where(p => !purchasedIds.Contains(p.Id)))
            {
                if (scoredProducts.ContainsKey(p.Id))
                    scoredProducts[p.Id].Score += 0.15;
                else
                    scoredProducts[p.Id] = new ScoredProduct
                    {
                        ProductId = p.Id, Score = 0.15,
                        Reason = $"Cùng thương hiệu {product.Brand}",
                        ReasonType = "brand"
                    };
            }
        }

        // Collaborative: users who viewed this also bought...
        if (!string.IsNullOrEmpty(userId))
        {
            var collabProducts = await GetCollaborativeByProduct(productId, userId);
            foreach (var cp in collabProducts.Where(cp => !purchasedIds.Contains(cp.ProductId)
                && cp.ProductId != productId))
            {
                if (scoredProducts.ContainsKey(cp.ProductId))
                    scoredProducts[cp.ProductId].Score += 0.25;
                else
                    scoredProducts[cp.ProductId] = cp with { Score = 0.25 };
            }
        }

        // Build response
        var topProducts = scoredProducts.Values
            .OrderByDescending(sp => sp.Score)
            .Take(limit).ToList();

        var productIds = topProducts.Select(sp => sp.ProductId).ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id) && p.IsActive)
            .ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var items = topProducts
            .Where(sp => productMap.ContainsKey(sp.ProductId))
            .Select(sp =>
            {
                var p = productMap[sp.ProductId];
                return new RecommendedProductDto
                {
                    Id = p.Id, Name = p.Name, Price = p.Price,
                    OriginalPrice = p.OriginalPrice, Image = p.ImageUrl,
                    Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
                    Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale,
                    Discount = p.Discount, Stock = p.Stock,
                    Reason = sp.Reason, ReasonType = sp.ReasonType
                };
            }).ToList();

        return new RecommendationResponse
        {
            Items = items, TotalCount = items.Count,
            IsPersonalized = !string.IsNullOrEmpty(userId)
        };
    }

    /// <summary>
    /// Track that a user viewed a product (for "recently viewed" strategy).
    /// </summary>
    public async Task TrackProductView(string userId, string productId)
    {
        var view = new ProductView
        {
            UserId = userId,
            ProductId = productId
        };
        await _db.ProductViews.InsertOneAsync(view);

        // Keep only last 50 views per user to avoid unbounded growth
        var viewCount = await _db.ProductViews.CountDocumentsAsync(pv => pv.UserId == userId);
        if (viewCount > 50)
        {
            var oldest = await _db.ProductViews.Find(pv => pv.UserId == userId)
                .Sort(Builders<ProductView>.Sort.Ascending(pv => pv.ViewedAt))
                .Limit((int)(viewCount - 50))
                .ToListAsync();

            var oldestIds = oldest.Select(o => o.Id).ToList();
            await _db.ProductViews.DeleteManyAsync(pv => oldestIds.Contains(pv.Id));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Strategy Implementations
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// Strategy 1: Category Affinity
    /// Analyze which categories the user interacts with most, then suggest
    /// top-rated products from those categories.
    /// </summary>
    private async Task<List<ScoredProduct>> GetCategoryAffinityProducts(
        List<Order> orders, List<WishlistItem> wishlist,
        List<CartItem> cart, List<Review> reviews,
        HashSet<string> purchasedProductIds)
    {
        // Count category interactions with different weights
        var categoryScores = new Dictionary<string, double>();

        // Orders: weight 3x (strongest signal)
        var orderProductIds = orders.SelectMany(o => o.Items.Select(i => i.ProductId)).Distinct().ToList();
        if (orderProductIds.Count > 0)
        {
            var orderProducts = await _db.Products.Find(p => orderProductIds.Contains(p.Id)).ToListAsync();
            foreach (var p in orderProducts)
            {
                categoryScores.TryGetValue(p.CategoryId, out var s);
                categoryScores[p.CategoryId] = s + 3.0;
            }
        }

        // Wishlist: weight 2x
        var wishlistProductIds = wishlist.Select(w => w.ProductId).Distinct().ToList();
        if (wishlistProductIds.Count > 0)
        {
            var wishlistProducts = await _db.Products.Find(p => wishlistProductIds.Contains(p.Id)).ToListAsync();
            foreach (var p in wishlistProducts)
            {
                categoryScores.TryGetValue(p.CategoryId, out var s);
                categoryScores[p.CategoryId] = s + 2.0;
            }
        }

        // Cart: weight 2x
        var cartProductIds = cart.Select(c => c.ProductId).Distinct().ToList();
        if (cartProductIds.Count > 0)
        {
            var cartProducts = await _db.Products.Find(p => cartProductIds.Contains(p.Id)).ToListAsync();
            foreach (var p in cartProducts)
            {
                categoryScores.TryGetValue(p.CategoryId, out var s);
                categoryScores[p.CategoryId] = s + 2.0;
            }
        }

        // Reviews: weight 1x
        var reviewProductIds = reviews.Select(r => r.ProductId).Distinct().ToList();
        if (reviewProductIds.Count > 0)
        {
            var reviewProducts = await _db.Products.Find(p => reviewProductIds.Contains(p.Id)).ToListAsync();
            foreach (var p in reviewProducts)
            {
                categoryScores.TryGetValue(p.CategoryId, out var s);
                categoryScores[p.CategoryId] = s + 1.0;
            }
        }

        if (categoryScores.Count == 0)
            return new List<ScoredProduct>();

        // Get top 3 categories
        var topCategories = categoryScores
            .OrderByDescending(kv => kv.Value)
            .Take(3)
            .Select(kv => kv.Key)
            .ToList();

        // Load category names
        var categories = await _db.Categories.Find(c => topCategories.Contains(c.Id)).ToListAsync();
        var categoryNameMap = categories.ToDictionary(c => c.Id, c => c.Name);

        // Find products from top categories that user hasn't purchased
        var allInteractedIds = purchasedProductIds
            .Union(wishlistProductIds).Union(cartProductIds).ToHashSet();

        var filter = Builders<Product>.Filter.Eq(p => p.IsActive, true) &
            Builders<Product>.Filter.In(p => p.CategoryId, topCategories) &
            Builders<Product>.Filter.Nin(p => p.Id, allInteractedIds);

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
            .Limit(10)
            .ToListAsync();

        return products.Select(p =>
        {
            var catName = categoryNameMap.GetValueOrDefault(p.CategoryId, "");
            var catScore = categoryScores.GetValueOrDefault(p.CategoryId, 1.0);
            return new ScoredProduct
            {
                ProductId = p.Id,
                Score = catScore / categoryScores.Values.Max(), // Normalize to 0-1
                Reason = $"Vì bạn thích {catName}",
                ReasonType = "category"
            };
        }).ToList();
    }

    /// <summary>
    /// Strategy 2: Price Range Match
    /// Suggest products within the user's typical spending range.
    /// </summary>
    private async Task<List<ScoredProduct>> GetPriceRangeProducts(
        List<Order> orders, HashSet<string> purchasedProductIds)
    {
        if (orders.Count == 0)
            return new List<ScoredProduct>();

        // Calculate average item price from order history
        var prices = orders.SelectMany(o => o.Items.Select(i => i.Price)).ToList();
        if (prices.Count == 0)
            return new List<ScoredProduct>();

        var avgPrice = prices.Average();
        var minPrice = avgPrice * 0.7m;
        var maxPrice = avgPrice * 1.3m;

        var filter = Builders<Product>.Filter.Eq(p => p.IsActive, true) &
            Builders<Product>.Filter.Gte(p => p.Price, minPrice) &
            Builders<Product>.Filter.Lte(p => p.Price, maxPrice) &
            Builders<Product>.Filter.Nin(p => p.Id, purchasedProductIds);

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
            .Limit(8)
            .ToListAsync();

        return products.Select(p => new ScoredProduct
        {
            ProductId = p.Id,
            Score = 1.0 - (double)Math.Abs(p.Price - avgPrice) / (double)avgPrice, // Closer to avg = higher score
            Reason = "Phù hợp ngân sách của bạn",
            ReasonType = "price"
        }).ToList();
    }

    /// <summary>
    /// Strategy 3: Simple Collaborative Filtering
    /// "Users who bought the same products as you also bought these."
    /// </summary>
    private async Task<List<ScoredProduct>> GetCollaborativeProducts(
        HashSet<string> purchasedProductIds, string userId)
    {
        if (purchasedProductIds.Count == 0)
            return new List<ScoredProduct>();

        // Find other users who bought the same products
        var productIdList = purchasedProductIds.Take(10).ToList(); // Limit for performance

        var similarOrders = await _db.Orders.Find(
            Builders<Order>.Filter.Ne(o => o.UserId, userId) &
            Builders<Order>.Filter.ElemMatch(o => o.Items,
                Builders<OrderItem>.Filter.In(i => i.ProductId, productIdList)))
            .Limit(20)
            .ToListAsync();

        if (similarOrders.Count == 0)
            return new List<ScoredProduct>();

        // Count how often each "other" product appears in similar users' orders
        var productCounts = new Dictionary<string, int>();
        foreach (var order in similarOrders)
        {
            foreach (var item in order.Items)
            {
                if (!purchasedProductIds.Contains(item.ProductId))
                {
                    productCounts.TryGetValue(item.ProductId, out var count);
                    productCounts[item.ProductId] = count + 1;
                }
            }
        }

        if (productCounts.Count == 0)
            return new List<ScoredProduct>();

        var maxCount = productCounts.Values.Max();
        return productCounts
            .OrderByDescending(kv => kv.Value)
            .Take(8)
            .Select(kv => new ScoredProduct
            {
                ProductId = kv.Key,
                Score = (double)kv.Value / maxCount, // Normalize
                Reason = "Người mua tương tự cũng thích",
                ReasonType = "collaborative"
            }).ToList();
    }

    /// <summary>
    /// Collaborative filtering for a specific product:
    /// "Users who viewed/bought this product also bought..."
    /// </summary>
    private async Task<List<ScoredProduct>> GetCollaborativeByProduct(
        string productId, string userId)
    {
        // Find users who also viewed this product
        var otherViewers = await _db.ProductViews.Find(
            pv => pv.ProductId == productId && pv.UserId != userId)
            .Limit(30).ToListAsync();

        var otherUserIds = otherViewers.Select(v => v.UserId).Distinct().Take(15).ToList();
        if (otherUserIds.Count == 0)
            return new List<ScoredProduct>();

        // What else did they buy?
        var theirOrders = await _db.Orders.Find(
            Builders<Order>.Filter.In(o => o.UserId, otherUserIds))
            .Limit(30).ToListAsync();

        var productCounts = new Dictionary<string, int>();
        foreach (var order in theirOrders)
        {
            foreach (var item in order.Items.Where(i => i.ProductId != productId))
            {
                productCounts.TryGetValue(item.ProductId, out var count);
                productCounts[item.ProductId] = count + 1;
            }
        }

        if (productCounts.Count == 0)
            return new List<ScoredProduct>();

        var maxCount = productCounts.Values.Max();
        return productCounts
            .OrderByDescending(kv => kv.Value)
            .Take(6)
            .Select(kv => new ScoredProduct
            {
                ProductId = kv.Key,
                Score = (double)kv.Value / maxCount,
                Reason = "Người xem sản phẩm này cũng mua",
                ReasonType = "collaborative"
            }).ToList();
    }

    /// <summary>
    /// Strategy 4: Recently Viewed but Not Purchased
    /// Remind the user about products they showed interest in.
    /// </summary>
    private async Task<List<ScoredProduct>> GetRecentlyViewedProducts(
        List<ProductView> views, HashSet<string> purchasedProductIds)
    {
        if (views.Count == 0)
            return new List<ScoredProduct>();

        // Get unique recently viewed product IDs, excluding purchased
        var viewedProductIds = views
            .Select(v => v.ProductId)
            .Distinct()
            .Where(id => !purchasedProductIds.Contains(id))
            .Take(8)
            .ToList();

        if (viewedProductIds.Count == 0)
            return new List<ScoredProduct>();

        // Count view frequency for scoring
        var viewCounts = views
            .GroupBy(v => v.ProductId)
            .ToDictionary(g => g.Key, g => g.Count());

        var maxViews = viewCounts.Values.Max();

        return viewedProductIds.Select((id, index) => new ScoredProduct
        {
            ProductId = id,
            Score = (double)viewCounts.GetValueOrDefault(id, 1) / maxViews *
                    (1.0 - index * 0.05), // Recency bonus: recent items score higher
            Reason = "Bạn đã xem gần đây",
            ReasonType = "viewed"
        }).ToList();
    }

    /// <summary>
    /// Strategy 5 / Fallback: Popular products
    /// Used when user has no data, or as filler to diversify results.
    /// </summary>
    private async Task<List<ScoredProduct>> GetPopularProducts(
        HashSet<string>? excludeIds = null)
    {
        var filter = Builders<Product>.Filter.Eq(p => p.IsActive, true);
        if (excludeIds != null && excludeIds.Count > 0)
            filter &= Builders<Product>.Filter.Nin(p => p.Id, excludeIds);

        // Mix: some on-sale, some top-rated
        var saleProducts = await _db.Products.Find(
            filter & Builders<Product>.Filter.Eq(p => p.OnSale, true))
            .Sort(Builders<Product>.Sort.Descending(p => p.Discount))
            .Limit(4).ToListAsync();

        var topRated = await _db.Products.Find(filter)
            .Sort(Builders<Product>.Sort.Descending(p => p.Rating))
            .Limit(4).ToListAsync();

        var combined = saleProducts.Union(topRated, new ProductIdComparer()).Take(8);

        return combined.Select(p => new ScoredProduct
        {
            ProductId = p.Id,
            Score = (double)p.Rating / 5.0 * 0.5 + (p.OnSale ? 0.3 : 0.0),
            Reason = p.OnSale ? "Đang giảm giá" : "Được đánh giá cao",
            ReasonType = "popular"
        }).ToList();
    }

    /// <summary>
    /// Fallback when user has no behavioral data.
    /// </summary>
    private async Task<RecommendationResponse> GetFallbackRecommendations(int limit)
    {
        var popular = await GetPopularProducts();

        var productIds = popular.Select(sp => sp.ProductId).ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id) && p.IsActive)
            .ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        var items = popular
            .Where(sp => productMap.ContainsKey(sp.ProductId))
            .Take(limit)
            .Select(sp =>
            {
                var p = productMap[sp.ProductId];
                return new RecommendedProductDto
                {
                    Id = p.Id, Name = p.Name, Price = p.Price,
                    OriginalPrice = p.OriginalPrice, Image = p.ImageUrl,
                    Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
                    Rating = p.Rating, Reviews = p.ReviewCount, OnSale = p.OnSale,
                    Discount = p.Discount, Stock = p.Stock,
                    Reason = sp.Reason, ReasonType = sp.ReasonType
                };
            }).ToList();

        return new RecommendationResponse
        {
            Items = items, TotalCount = items.Count, IsPersonalized = false
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════

    private static void MergeScores(
        Dictionary<string, ScoredProduct> target,
        List<ScoredProduct> source, double weight)
    {
        foreach (var sp in source)
        {
            if (target.TryGetValue(sp.ProductId, out var existing))
            {
                existing.Score += sp.Score * weight;
                // Keep the reason from the highest-weight strategy
                if (sp.Score * weight > existing.HighestContribution)
                {
                    existing.Reason = sp.Reason;
                    existing.ReasonType = sp.ReasonType;
                    existing.HighestContribution = sp.Score * weight;
                }
            }
            else
            {
                target[sp.ProductId] = new ScoredProduct
                {
                    ProductId = sp.ProductId,
                    Score = sp.Score * weight,
                    Reason = sp.Reason,
                    ReasonType = sp.ReasonType,
                    HighestContribution = sp.Score * weight
                };
            }
        }
    }

    // Internal scoring model
    private record ScoredProduct
    {
        public string ProductId { get; set; } = null!;
        public double Score { get; set; }
        public string Reason { get; set; } = "";
        public string ReasonType { get; set; } = "";
        public double HighestContribution { get; set; }
    }

    // Comparer for Product dedup
    private class ProductIdComparer : IEqualityComparer<Product>
    {
        public bool Equals(Product? x, Product? y) => x?.Id == y?.Id;
        public int GetHashCode(Product obj) => obj.Id.GetHashCode();
    }
}
