namespace EcommerceApi.DTOs.Payments;

public class CreateIntentRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
}

public class CreateIntentResponse
{
    public string ClientSecret { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string PaymentIntentId { get; set; } = string.Empty;
}
