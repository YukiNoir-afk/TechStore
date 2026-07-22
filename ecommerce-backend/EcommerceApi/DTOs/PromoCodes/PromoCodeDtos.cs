namespace EcommerceApi.DTOs.PromoCodes;

public class CreatePromoCodeRequest
{
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderValue { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int UsageLimit { get; set; }
}

public class UpdatePromoCodeRequest : CreatePromoCodeRequest
{
    public bool IsActive { get; set; }
}

public class ValidatePromoCodeRequest
{
    public string Code { get; set; } = string.Empty;
}
