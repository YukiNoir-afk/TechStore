using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class VnPayService
{
    private readonly IConfiguration _config;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public VnPayService(IConfiguration config, IHttpContextAccessor httpContextAccessor)
    {
        _config = config;
        _httpContextAccessor = httpContextAccessor;
    }

    public string CreatePaymentUrl(Order order)
    {
        var vnp_TmnCode = _config["VNPay:TmnCode"];
        var vnp_HashSecret = _config["VNPay:HashSecret"];
        var vnp_Url = _config["VNPay:PaymentUrl"];
        var vnp_ReturnUrl = _config["VNPay:ReturnUrl"];

        var vnpayData = new SortedList<string, string>(new VnPayCompare());
        
        var ipAddr = GetIpAddress();

        vnpayData.Add("vnp_Version", "2.1.0");
        vnpayData.Add("vnp_Command", "pay");
        vnpayData.Add("vnp_TmnCode", vnp_TmnCode!);
        vnpayData.Add("vnp_Amount", ((long)(order.Total * 100)).ToString()); // x100 for VNPay
        vnpayData.Add("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
        vnpayData.Add("vnp_CurrCode", "VND");
        vnpayData.Add("vnp_IpAddr", ipAddr);
        vnpayData.Add("vnp_Locale", "vn");
        vnpayData.Add("vnp_OrderInfo", $"Thanh toan don hang {order.Id}");
        vnpayData.Add("vnp_OrderType", "other");
        vnpayData.Add("vnp_ReturnUrl", vnp_ReturnUrl!);
        vnpayData.Add("vnp_TxnRef", order.Id); // use order ID directly as transaction reference

        var query = new StringBuilder();
        foreach (var kv in vnpayData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                query.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }
        var queryString = query.ToString().TrimEnd('&');

        var signData = queryString;
        var vnp_SecureHash = ComputeHmacSha512(signData, vnp_HashSecret!);
        
        return $"{vnp_Url}?{queryString}&vnp_SecureHash={vnp_SecureHash}";
    }

    public VnPayValidateResult ValidateCallback(IQueryCollection query)
    {
        var vnp_HashSecret = _config["VNPay:HashSecret"];
        var vnpayData = new SortedList<string, string>(new VnPayCompare());
        
        foreach (var key in query.Keys)
        {
            var value = query[key].ToString();
            if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
            {
                vnpayData.Add(key, value);
            }
        }

        var vnp_SecureHash = vnpayData.GetValueOrDefault("vnp_SecureHash");
        vnpayData.Remove("vnp_SecureHash");
        vnpayData.Remove("vnp_SecureHashType");

        var hashData = new StringBuilder();
        foreach (var kv in vnpayData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                hashData.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }
        var signData = hashData.ToString().TrimEnd('&');
        var checkSum = ComputeHmacSha512(signData, vnp_HashSecret!);

        var isSuccess = checkSum.Equals(vnp_SecureHash, StringComparison.InvariantCultureIgnoreCase);
        
        return new VnPayValidateResult
        {
            IsSuccess = isSuccess,
            OrderId = vnpayData.GetValueOrDefault("vnp_TxnRef"),
            TransactionId = vnpayData.GetValueOrDefault("vnp_TransactionNo"),
            ResponseCode = vnpayData.GetValueOrDefault("vnp_ResponseCode")
        };
    }

    private string ComputeHmacSha512(string message, string secretKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(messageBytes);

        var hex = new StringBuilder(hashBytes.Length * 2);
        foreach (var b in hashBytes)
            hex.AppendFormat("{0:x2}", b);

        return hex.ToString();
    }
    
    private string GetIpAddress()
    {
        var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
        if (ip == "::1" || string.IsNullOrEmpty(ip))
        {
            ip = "127.0.0.1";
        }
        return ip;
    }
}

public class VnPayValidateResult
{
    public bool IsSuccess { get; set; }
    public string? OrderId { get; set; }
    public string? TransactionId { get; set; }
    public string? ResponseCode { get; set; }
}

public class VnPayCompare : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        if (x == y) return 0;
        if (x == null) return -1;
        if (y == null) return 1;
        var Compare = CompareInfo.GetCompareInfo("en-US");
        return Compare.Compare(x, y, CompareOptions.Ordinal);
    }
}
