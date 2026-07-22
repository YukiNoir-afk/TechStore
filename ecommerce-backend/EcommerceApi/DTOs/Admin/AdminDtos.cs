namespace EcommerceApi.DTOs.Admin;

public class DashboardStatsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalProducts { get; set; }
    public int TotalUsers { get; set; }
    public int PendingOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int ShippedOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
}

public class RecentOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int ItemCount { get; set; }
}

public class TopProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public decimal Price { get; set; }
    public int TotalSold { get; set; }
    public decimal Revenue { get; set; }
}

public class AdminOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string ShippingMethod { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
    public int ItemCount { get; set; }
    public DateTime Date { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Description { get; set; }
}

public class AdminProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Image { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public int Stock { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool OnSale { get; set; }
    public int? Discount { get; set; }
    public string? Brand { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public int Stock { get; set; }
    public bool OnSale { get; set; }
    public int? Discount { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? Weight { get; set; }
    public string? Warranty { get; set; }
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockedAt { get; set; }
    public string? LockReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── User Lock ────────────────────────────────────────────────────────
public class LockUserRequest
{
    public string? Reason { get; set; }
}

// ── Order History by Phone ───────────────────────────────────────────
public class OrderHistoryByPhoneDto
{
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public List<AdminOrderDto> Orders { get; set; } = new();
}

// ── Category CRUD ────────────────────────────────────────────────────
public class AdminCategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int ProductCount { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

// ── Inventory ────────────────────────────────────────────────────────
public class StockTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string? Reason { get; set; }
    public string? Note { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateStockTransactionRequest
{
    public string ProductId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "import" or "export"
    public int Quantity { get; set; }
    public string? Reason { get; set; }
    public string? Note { get; set; }
}

// ── Customer Care: Reviews ───────────────────────────────────────────
public class AdminReviewDto
{
    public string Id { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ── Customer Care: Support Tickets ───────────────────────────────────
public class AdminSupportTicketDto
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int ResponseCount { get; set; }
    public List<TicketResponseDto> Responses { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TicketResponseDto
{
    public string Message { get; set; } = string.Empty;
    public string RespondedBy { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}

