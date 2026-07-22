using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Reviews;

namespace EcommerceApi.Services;

public class ReviewService
{
    private readonly MongoDbContext _db;
    public ReviewService(MongoDbContext db) { _db = db; }

    public async Task<ReviewSummaryDto> GetProductReviews(string productId)
    {
        var reviews = await _db.Reviews.Find(r => r.ProductId == productId)
            .Sort(Builders<Models.Review>.Sort.Descending(r => r.CreatedAt))
            .ToListAsync();

        // Load user names
        var userIds = reviews.Select(r => r.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        var distribution = Enumerable.Range(1, 5).ToDictionary(i => i, i => reviews.Count(r => r.Rating == i));

        return new ReviewSummaryDto
        {
            AverageRating = reviews.Any() ? Math.Round((decimal)reviews.Average(r => r.Rating), 1) : 0,
            TotalReviews = reviews.Count,
            RatingDistribution = distribution,
            Reviews = reviews.Select(r =>
            {
                var user = userMap.GetValueOrDefault(r.UserId);
                return new ReviewDto
                {
                    Id = r.Id, Rating = r.Rating, Title = r.Title, Comment = r.Comment,
                    UserName = user != null ? $"{user.FirstName} {user.LastName[0]}." : "Anonymous",
                    CreatedAt = r.CreatedAt
                };
            }).ToList()
        };
    }

    /// <summary>
    /// Check if a user is eligible to review a product.
    /// User must have a delivered order containing the product and not have already reviewed it.
    /// </summary>
    public async Task<ReviewEligibilityDto> CheckReviewEligibility(string userId, string productId)
    {
        // Check if already reviewed
        var alreadyReviewed = await _db.Reviews.Find(r => r.UserId == userId && r.ProductId == productId).AnyAsync();
        if (alreadyReviewed)
            return new ReviewEligibilityDto { CanReview = false, Reason = "Bạn đã đánh giá sản phẩm này rồi" };

        // Check if user has a delivered order containing this product
        var hasDeliveredOrder = await _db.Orders.Find(o =>
            o.UserId == userId &&
            o.Status == "Delivered" &&
            o.Items.Any(i => i.ProductId == productId)
        ).AnyAsync();

        if (!hasDeliveredOrder)
            return new ReviewEligibilityDto { CanReview = false, Reason = "Bạn chỉ có thể đánh giá sau khi đơn hàng đã được giao thành công" };

        return new ReviewEligibilityDto { CanReview = true };
    }

    public async Task<ReviewDto> CreateReview(string userId, string productId, CreateReviewRequest request)
    {
        // Check review eligibility
        var eligibility = await CheckReviewEligibility(userId, productId);
        if (!eligibility.CanReview)
            throw new InvalidOperationException(eligibility.Reason!);

        var product = await _db.Products.Find(p => p.Id == productId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Product not found");
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("User not found");

        var review = new Models.Review
        {
            UserId = userId, ProductId = productId, Rating = request.Rating,
            Title = request.Title, Comment = request.Comment
        };
        await _db.Reviews.InsertOneAsync(review);

        // Update product rating
        var allRatings = await _db.Reviews.Find(r => r.ProductId == productId)
            .Project(r => r.Rating).ToListAsync();
        var avgRating = Math.Round((decimal)allRatings.Average(), 2);

        await _db.Products.UpdateOneAsync(
            p => p.Id == productId,
            Builders<Models.Product>.Update
                .Set(p => p.Rating, avgRating)
                .Set(p => p.ReviewCount, allRatings.Count));

        return new ReviewDto
        {
            Id = review.Id, Rating = review.Rating, Title = review.Title, Comment = review.Comment,
            UserName = $"{user.FirstName} {user.LastName[0]}.", CreatedAt = review.CreatedAt
        };
    }
}
