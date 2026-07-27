using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class MomoService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public MomoService(IConfiguration config, HttpClient http)
    {
        _config = config;
        _http = http;
    }

    public async Task<string> CreatePaymentAsync(Order order, string requestType = "captureWallet")
    {
        var endpoint = _config["MoMo:Endpoint"];
        var partnerCode = _config["MoMo:PartnerCode"];
        var accessKey = _config["MoMo:AccessKey"];
        var secretKey = _config["MoMo:SecretKey"];
        var returnUrl = _config["MoMo:ReturnUrl"];
        var ipnUrl = _config["MoMo:NotifyUrl"];

        var requestId = Guid.NewGuid().ToString();
        var orderId = order.Id;
        var amount = ((long)order.Total).ToString();
        var orderInfo = $"Payment for order {orderId} at TechStore";
        var extraData = ""; // pass empty string if no extra data

        // Generate signature
        // format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        var rawHash = $"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";
        var signature = ComputeHmacSha256(rawHash, secretKey);

        var requestData = new
        {
            partnerCode,
            partnerName = "Test",
            storeId = "MomoTestStore",
            requestId,
            amount = long.Parse(amount),
            orderId,
            orderInfo,
            redirectUrl = returnUrl,
            ipnUrl,
            lang = "vi",
            extraData,
            requestType,
            signature
        };

        var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(endpoint, content);
        
        var responseString = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"MoMo API request failed: {responseString}");
        }

        using var json = JsonDocument.Parse(responseString);
        var root = json.RootElement;

        var resultCode = root.GetProperty("resultCode").GetInt32();
        if (resultCode == 0)
        {
            return root.GetProperty("payUrl").GetString() ?? throw new Exception("Không tìm thấy payUrl từ MoMo");
        }
        else
        {
            var message = root.GetProperty("message").GetString();
            throw new Exception($"Lỗi tạo thanh toán MoMo: {message}");
        }
    }

    public bool VerifySignature(string rawHash, string expectedSignature)
    {
        var secretKey = _config["MoMo:SecretKey"];
        var computedSignature = ComputeHmacSha256(rawHash, secretKey);
        return computedSignature == expectedSignature;
    }

    private static string ComputeHmacSha256(string message, string secretKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);

        var hex = new StringBuilder(hashBytes.Length * 2);
        foreach (var b in hashBytes)
            hex.AppendFormat("{0:x2}", b);

        return hex.ToString();
    }
}
