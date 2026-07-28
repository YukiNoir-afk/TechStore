using Stripe;
using EcommerceApi.DTOs.Payments;

namespace EcommerceApi.Services;

public class PaymentService
{
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(IConfiguration config, ILogger<PaymentService> logger)
    {
        _config = config;
        _logger = logger;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    /// <summary>
    /// Create a Stripe PaymentIntent and return clientSecret + publishableKey.
    /// The frontend uses clientSecret to confirm the payment directly with Stripe.
    /// </summary>
    public async Task<CreateIntentResponse> CreatePaymentIntent(decimal amount, string currency = "usd")
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = (long)(amount * 100), // Stripe uses cents
            Currency = currency,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
        };

        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(options);

        return new CreateIntentResponse
        {
            ClientSecret = intent.ClientSecret!,
            PublishableKey = _config["Stripe:PublishableKey"]!,
            PaymentIntentId = intent.Id
        };
    }

    /// <summary>
    /// Verify a PaymentIntent is actually paid (called before creating order).
    /// </summary>
    public async Task<bool> VerifyPayment(string paymentIntentId, decimal expectedAmount, string currency = "vnd")
    {
        // Skip verification in test mode if key not configured
        var secretKey = _config["Stripe:SecretKey"];
        if (string.IsNullOrEmpty(secretKey) || secretKey.Contains("YOUR_STRIPE"))
        {
            _logger.LogError("Stripe chưa được cấu hình - từ chối xác thực thanh toán");
            return false;
        }

        try
        {
            var service = new PaymentIntentService();
            var intent = await service.GetAsync(paymentIntentId);
            var expectedCents = (long)Math.Round(expectedAmount * 100);
            
            return intent.Status == "succeeded" 
                && intent.Amount == expectedCents
                && string.Equals(intent.Currency, currency, StringComparison.OrdinalIgnoreCase);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe verification failed for PaymentIntent {Id}", paymentIntentId);
            return false;
        }
    }
}
