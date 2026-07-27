namespace EcommerceApi.DTOs.Vouchers;

// Response DTO cho customer - hiển thị trong catalog
public class VoucherCatalogItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public string TierRequired { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int MaxClaims { get; set; }
    public int ClaimedCount { get; set; }
    public bool IsLocked { get; set; }        // true nếu hạng user < hạng yêu cầu
    public bool IsClaimable { get; set; }      // true nếu đủ hạng + chưa claim + còn slot
    public bool AlreadyClaimed { get; set; }   // true nếu user đã claim template này
    public DateTime CreatedAt { get; set; }
}

// Response DTO cho admin
public class VoucherTemplateDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CodePrefix { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public string TierRequired { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int MaxClaims { get; set; }
    public int ClaimedCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Admin tạo template mới
public class CreateVoucherTemplateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CodePrefix { get; set; } // null = auto-gen
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public string TierRequired { get; set; } = "Bronze";
    public DateTime? ExpiryDate { get; set; } // null = 30 ngày
    public int MaxClaims { get; set; } = 0; // 0 = unlimited
}

// Response khi claim thành công
public class ClaimVoucherResponse
{
    public string Message { get; set; } = string.Empty;
    public VoucherDto Voucher { get; set; } = null!;
}
