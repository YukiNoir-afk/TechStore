namespace EcommerceApi.DTOs.Vouchers;

public class VoucherDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public string TierRequired { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AdminGiveVoucherRequest
{
    public string UserId { get; set; } = string.Empty;
    public string? Code { get; set; } // null = auto-gen
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public string TierRequired { get; set; } = "Bronze";
    public DateTime? ExpiryDate { get; set; } // null = 30 ngày
}

public class AdminGiveVoucherToTierRequest
{
    public string Tier { get; set; } = string.Empty; // Bronze, Silver, Gold, Platinum
    public string? Code { get; set; } // null = auto-gen per user
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class ValidateVoucherRequest
{
    public string Code { get; set; } = string.Empty;
}

public class VoucherValidationResult
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
}
