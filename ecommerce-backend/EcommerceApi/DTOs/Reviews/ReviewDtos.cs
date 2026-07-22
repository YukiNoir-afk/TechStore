namespace EcommerceApi.DTOs.Reviews;

public class ReviewDto
{
    public string Id { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
}

public class ReviewSummaryDto
{
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
    public List<ReviewDto> Reviews { get; set; } = new();
}

public class ReviewEligibilityDto
{
    public bool CanReview { get; set; }
    public string? Reason { get; set; }
}

