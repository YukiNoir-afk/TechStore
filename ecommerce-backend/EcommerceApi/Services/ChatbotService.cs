using System.Text.RegularExpressions;
using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Chatbot;

namespace EcommerceApi.Services;

public class ChatbotService
{
    private readonly MongoDbContext _db;
    private readonly RecommendationService _recommendations;
    public ChatbotService(MongoDbContext db, RecommendationService recommendations)
    {
        _db = db;
        _recommendations = recommendations;
    }

    public async Task<ChatMessageResponse> ProcessMessageAsync(string message, string? userId)
    {
        var msg = message.Trim().ToLower();

        // Greeting
        if (IsGreeting(msg))
            return Greeting();

        // Order tracking
        if (IsOrderQuery(msg))
            return await HandleOrderQuery(msg, userId);

        // Product search / recommendation
        if (IsProductQuery(msg))
            return await HandleProductQuery(msg, userId);

        // Category browsing
        if (IsCategoryQuery(msg))
            return await HandleCategoryQuery(msg);

        // Price / budget query
        if (IsPriceQuery(msg))
            return await HandlePriceQuery(msg);

        // Sale / discount
        if (IsSaleQuery(msg))
            return await HandleSaleQuery();

        // Shipping policy
        if (IsShippingQuery(msg))
            return ShippingInfo();

        // Payment policy
        if (IsPaymentQuery(msg))
            return PaymentInfo();

        // Return / refund policy
        if (IsReturnQuery(msg))
            return ReturnInfo();

        // Warranty
        if (IsWarrantyQuery(msg))
            return WarrantyInfo();

        // Contact
        if (IsContactQuery(msg))
            return ContactInfo();

        // Help
        if (IsHelpQuery(msg))
            return HelpMenu();

        // Thanks
        if (IsThankYou(msg))
            return ThankYou();

        // Default fallback
        return Fallback();
    }

    // ─── Intent Detection ──────────────────────────────────────────

    private static bool IsGreeting(string msg)
        => Regex.IsMatch(msg, @"\b(xin chào|chào|hi|hello|hey|alo|xin chao)\b");

    private static bool IsOrderQuery(string msg)
        => Regex.IsMatch(msg, @"\b(đơn hàng|don hang|đơn|order|theo dõi|tracking|giao hàng|giao hang|tình trạng|tinh trang|trạng thái|trang thai)\b");

    private static bool IsProductQuery(string msg)
        => Regex.IsMatch(msg, @"\b(sản phẩm|san pham|tìm|tim|mua|tư vấn|tu van|gợi ý|goi y|recommend|suggest|dành cho tôi|danh cho toi|phù hợp|phu hop|cho tôi|cho toi|laptop|điện thoại|dien thoai|tai nghe|phone|máy tính|may tinh|iphone|samsung|macbook)\b");

    private static bool IsCategoryQuery(string msg)
        => Regex.IsMatch(msg, @"\b(danh mục|danh muc|loại|loai|category|thể loại|the loai|nhóm|nhom)\b");

    private static bool IsPriceQuery(string msg)
        => Regex.IsMatch(msg, @"\b(giá|gia|price|bao nhiêu|bao nhieu|budget|ngân sách|ngan sach|rẻ|re|đắt|dat|tầm|tam)\b.*\d|(\d+).*\b(triệu|trieu|tr|k|nghìn|nghin|đồng|dong)\b");

    private static bool IsSaleQuery(string msg)
        => Regex.IsMatch(msg, @"\b(sale|giảm giá|giam gia|khuyến mãi|khuyen mai|ưu đãi|uu dai|promotion|discount|hot deal)\b");

    private static bool IsShippingQuery(string msg)
        => Regex.IsMatch(msg, @"\b(giao hàng|giao hang|ship|shipping|vận chuyển|van chuyen|phí ship|phi ship|freeship|miễn phí|mien phi|delivery)\b");

    private static bool IsPaymentQuery(string msg)
        => Regex.IsMatch(msg, @"\b(thanh toán|thanh toan|payment|trả góp|tra gop|thẻ|the|visa|mastercard|momo|zalopay|chuyển khoản|chuyen khoan|cod|tiền mặt|tien mat)\b");

    private static bool IsReturnQuery(string msg)
        => Regex.IsMatch(msg, @"\b(đổi trả|doi tra|hoàn tiền|hoan tien|return|refund|trả lại|tra lai|đổi hàng|doi hang)\b");

    private static bool IsWarrantyQuery(string msg)
        => Regex.IsMatch(msg, @"\b(bảo hành|bao hanh|warranty|sửa chữa|sua chua|hỏng|hong|lỗi|loi)\b");

    private static bool IsContactQuery(string msg)
        => Regex.IsMatch(msg, @"\b(liên hệ|lien he|contact|hotline|số điện thoại|so dien thoai|email|hỗ trợ|ho tro|tổng đài|tong dai|cửa hàng|cua hang)\b");

    private static bool IsHelpQuery(string msg)
        => Regex.IsMatch(msg, @"\b(help|giúp|giup|hướng dẫn|huong dan|menu|trợ giúp|tro giup|làm sao|lam sao|cách|cach)\b");

    private static bool IsThankYou(string msg)
        => Regex.IsMatch(msg, @"\b(cảm ơn|cam on|thanks|thank you|ok|được rồi|duoc roi|tuyệt|tuyet|great)\b");

    // ─── Handlers ──────────────────────────────────────────────────

    private ChatMessageResponse Greeting()
    {
        return new ChatMessageResponse
        {
            Reply = "Xin chào! 👋 Tôi là trợ lý mua sắm của TechStore. Tôi có thể giúp bạn:\n\n" +
                    "🔍 Tìm kiếm & gợi ý sản phẩm\n" +
                    "📦 Theo dõi đơn hàng\n" +
                    "💰 Tìm sản phẩm theo ngân sách\n" +
                    "🏷️ Thông tin khuyến mãi\n" +
                    "📋 Chính sách mua hàng\n\n" +
                    "Bạn cần tôi hỗ trợ gì?",
            Type = "text",
            QuickReplies = new List<string>
            {
                "🔍 Gợi ý sản phẩm",
                "🏷️ Sản phẩm giảm giá",
                "📦 Theo dõi đơn hàng",
                "📋 Chính sách giao hàng",
                "❓ Xem tất cả dịch vụ"
            }
        };
    }

    private async Task<ChatMessageResponse> HandleOrderQuery(string msg, string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return new ChatMessageResponse
            {
                Reply = "📦 Để xem thông tin đơn hàng, bạn cần đăng nhập trước nhé!\n\n" +
                        "Sau khi đăng nhập, bạn có thể:\n" +
                        "• Xem lịch sử đơn hàng tại trang \"Đơn hàng\"\n" +
                        "• Hỏi tôi về tình trạng đơn hàng",
                Type = "text",
                QuickReplies = new List<string> { "🔍 Tìm sản phẩm", "📋 Chính sách giao hàng" }
            };
        }

        var orders = await _db.Orders.Find(o => o.UserId == userId)
            .Sort(Builders<Models.Order>.Sort.Descending(o => o.CreatedAt))
            .Limit(3)
            .ToListAsync();

        if (!orders.Any())
        {
            return new ChatMessageResponse
            {
                Reply = "📦 Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi nhé!",
                Type = "text",
                QuickReplies = new List<string> { "🔍 Gợi ý sản phẩm", "🏷️ Sản phẩm giảm giá" }
            };
        }

        var statusMap = new Dictionary<string, string>
        {
            ["Pending"] = "⏳ Chờ xử lý",
            ["Confirmed"] = "✅ Đã xác nhận",
            ["Processing"] = "🔄 Đang xử lý",
            ["Shipped"] = "🚚 Đang giao",
            ["Delivered"] = "📬 Đã giao",
            ["Cancelled"] = "❌ Đã hủy"
        };

        var orderInfo = string.Join("\n\n", orders.Select(o =>
        {
            var status = statusMap.GetValueOrDefault(o.Status, o.Status);
            return $"📋 Đơn #{o.Id[^6..]}\n" +
                   $"   Trạng thái: {status}\n" +
                   $"   Tổng tiền: {o.Total:N0}₫\n" +
                   $"   Ngày đặt: {o.CreatedAt:dd/MM/yyyy}";
        }));

        return new ChatMessageResponse
        {
            Reply = $"📦 Đây là các đơn hàng gần đây của bạn:\n\n{orderInfo}\n\n" +
                    "Bạn có thể xem chi tiết tại trang \"Đơn hàng\" nhé!",
            Type = "order",
            QuickReplies = new List<string> { "🔍 Tìm sản phẩm", "📋 Chính sách đổi trả" }
        };
    }

    private async Task<ChatMessageResponse> HandleProductQuery(string msg, string? userId)
    {
        // If user is logged in and asking for generic suggestions, use personalized recommendations
        if (!string.IsNullOrEmpty(userId) && IsPersonalSuggestionRequest(msg))
        {
            return await HandlePersonalizedSuggestion(userId);
        }

        // Extract keywords for search
        var searchTerms = ExtractSearchTerms(msg);

        var filter = Builders<Models.Product>.Filter.Eq(p => p.IsActive, true);

        if (!string.IsNullOrEmpty(searchTerms))
        {
            filter &= Builders<Models.Product>.Filter.Regex(p => p.Name,
                new MongoDB.Bson.BsonRegularExpression(searchTerms, "i")) |
                Builders<Models.Product>.Filter.Regex(p => p.Description,
                    new MongoDB.Bson.BsonRegularExpression(searchTerms, "i"));
        }

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Models.Product>.Sort.Descending(p => p.Rating))
            .Limit(4)
            .ToListAsync();

        if (!products.Any())
        {
            // Fallback to featured products
            products = await _db.Products.Find(Builders<Models.Product>.Filter.Eq(p => p.IsActive, true))
                .Sort(Builders<Models.Product>.Sort.Descending(p => p.Rating))
                .Limit(4)
                .ToListAsync();

            return new ChatMessageResponse
            {
                Reply = $"🔍 Tôi không tìm thấy sản phẩm phù hợp với \"{searchTerms}\", nhưng đây là những sản phẩm nổi bật nhất của chúng tôi:",
                Type = "products",
                Products = products.Select(MapProduct).ToList(),
                QuickReplies = new List<string> { "🏷️ Sản phẩm giảm giá", "📂 Xem danh mục", "❓ Trợ giúp" }
            };
        }

        return new ChatMessageResponse
        {
            Reply = $"🎯 Đây là những sản phẩm phù hợp với yêu cầu của bạn:",
            Type = "products",
            Products = products.Select(MapProduct).ToList(),
            QuickReplies = new List<string> { "🏷️ Xem thêm giảm giá", "📂 Xem danh mục", "💰 Tìm theo giá" }
        };
    }

    private static bool IsPersonalSuggestionRequest(string msg)
        => Regex.IsMatch(msg, @"(gợi ý|goi y|recommend|suggest|tư vấn|tu van|dành cho|danh cho|phù hợp|phu hop|cho tôi|cho toi|nên mua|nen mua)");

    private async Task<ChatMessageResponse> HandlePersonalizedSuggestion(string userId)
    {
        var result = await _recommendations.GetPersonalRecommendations(userId, 4);

        if (result.Items.Count == 0)
        {
            return new ChatMessageResponse
            {
                Reply = "🔍 Tôi chưa có đủ dữ liệu để gợi ý riêng cho bạn. Hãy khám phá các sản phẩm nổi bật nhé!",
                Type = "text",
                QuickReplies = new List<string> { "🏷️ Sản phẩm giảm giá", "📂 Xem danh mục" }
            };
        }

        var personalTag = result.IsPersonalized ? "cá nhân hóa" : "phổ biến";
        return new ChatMessageResponse
        {
            Reply = $"✨ Đây là sản phẩm được gợi ý {personalTag} dành riêng cho bạn:",
            Type = "products",
            Products = result.Items.Select(p => new DTOs.Chatbot.ChatProductSuggestion
            {
                Id = p.Id, Name = p.Name, Price = p.Price,
                OriginalPrice = p.OriginalPrice, Image = p.Image,
                Rating = p.Rating, Reviews = p.Reviews,
                OnSale = p.OnSale, Discount = p.Discount
            }).ToList(),
            QuickReplies = new List<string> { "🔍 Tìm sản phẩm cụ thể", "📂 Xem danh mục", "🏷️ Giảm giá" }
        };
    }

    private async Task<ChatMessageResponse> HandleCategoryQuery(string msg)
    {
        var categories = await _db.Categories.Find(_ => true).ToListAsync();

        if (!categories.Any())
        {
            return new ChatMessageResponse
            {
                Reply = "📂 Hiện tại chưa có danh mục nào. Vui lòng quay lại sau nhé!",
                Type = "text"
            };
        }

        var categoryList = string.Join("\n", categories.Select(c => $"  📁 {c.Name}"));

        return new ChatMessageResponse
        {
            Reply = $"📂 Các danh mục sản phẩm tại TechStore:\n\n{categoryList}\n\n" +
                    "Bạn muốn xem sản phẩm thuộc danh mục nào?",
            Type = "text",
            QuickReplies = categories.Take(5).Select(c => $"📁 {c.Name}").ToList()
        };
    }

    private async Task<ChatMessageResponse> HandlePriceQuery(string msg)
    {
        // Extract price range from message
        var (minPrice, maxPrice) = ExtractPriceRange(msg);

        var filter = Builders<Models.Product>.Filter.Eq(p => p.IsActive, true);

        if (minPrice > 0) filter &= Builders<Models.Product>.Filter.Gte(p => p.Price, minPrice);
        if (maxPrice > 0) filter &= Builders<Models.Product>.Filter.Lte(p => p.Price, maxPrice);

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Models.Product>.Sort.Ascending(p => p.Price))
            .Limit(4)
            .ToListAsync();

        if (!products.Any())
        {
            return new ChatMessageResponse
            {
                Reply = "💰 Không tìm thấy sản phẩm trong khoảng giá này. Bạn thử mở rộng khoảng giá nhé!",
                Type = "text",
                QuickReplies = new List<string> { "🔍 Gợi ý sản phẩm", "🏷️ Sản phẩm giảm giá" }
            };
        }

        var priceRange = maxPrice > 0 ? $"{minPrice:N0}₫ - {maxPrice:N0}₫" : $"từ {minPrice:N0}₫";

        return new ChatMessageResponse
        {
            Reply = $"💰 Sản phẩm trong khoảng giá {priceRange}:",
            Type = "products",
            Products = products.Select(MapProduct).ToList(),
            QuickReplies = new List<string> { "🔍 Tìm sản phẩm khác", "📂 Xem danh mục" }
        };
    }

    private async Task<ChatMessageResponse> HandleSaleQuery()
    {
        var filter = Builders<Models.Product>.Filter.Eq(p => p.IsActive, true) &
                     Builders<Models.Product>.Filter.Eq(p => p.OnSale, true);

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Models.Product>.Sort.Descending(p => p.Discount))
            .Limit(4)
            .ToListAsync();

        if (!products.Any())
        {
            return new ChatMessageResponse
            {
                Reply = "🏷️ Hiện tại chưa có sản phẩm giảm giá. Hãy theo dõi để không bỏ lỡ nhé!",
                Type = "text",
                QuickReplies = new List<string> { "🔍 Gợi ý sản phẩm", "📂 Xem danh mục" }
            };
        }

        return new ChatMessageResponse
        {
            Reply = "🔥 Sản phẩm đang giảm giá hot nhất:",
            Type = "products",
            Products = products.Select(MapProduct).ToList(),
            QuickReplies = new List<string> { "🔍 Tìm sản phẩm khác", "📂 Xem danh mục", "💰 Tìm theo giá" }
        };
    }

    private static ChatMessageResponse ShippingInfo()
    {
        return new ChatMessageResponse
        {
            Reply = "🚚 **Chính sách giao hàng TechStore:**\n\n" +
                    "📍 **Phạm vi**: Giao hàng toàn quốc\n" +
                    "⏱️ **Thời gian**:\n" +
                    "  • Nội thành: 1-2 ngày\n" +
                    "  • Ngoại thành: 3-5 ngày\n" +
                    "  • Vùng sâu/xa: 5-7 ngày\n\n" +
                    "💰 **Phí ship**:\n" +
                    "  • Đơn hàng trên 500.000₫: Miễn phí\n" +
                    "  • Đơn dưới 500.000₫: 30.000₫\n\n" +
                    "📋 Kiểm tra hàng trước khi thanh toán (COD)",
            Type = "text",
            QuickReplies = new List<string> { "💳 Thanh toán", "📋 Đổi trả", "🔍 Tìm sản phẩm" }
        };
    }

    private static ChatMessageResponse PaymentInfo()
    {
        return new ChatMessageResponse
        {
            Reply = "💳 **Phương thức thanh toán:**\n\n" +
                    "💵 **COD** - Thanh toán khi nhận hàng\n" +
                    "💳 **Thẻ tín dụng/ghi nợ** - Visa, Mastercard\n" +
                    "🏦 **Chuyển khoản ngân hàng**\n" +
                    "📱 **Ví điện tử** - Stripe\n\n" +
                    "🔒 Mọi giao dịch đều được mã hóa & bảo mật",
            Type = "text",
            QuickReplies = new List<string> { "🚚 Giao hàng", "📋 Đổi trả", "🔍 Tìm sản phẩm" }
        };
    }

    private static ChatMessageResponse ReturnInfo()
    {
        return new ChatMessageResponse
        {
            Reply = "🔄 **Chính sách đổi trả:**\n\n" +
                    "📅 **Thời gian**: 7 ngày kể từ khi nhận hàng\n" +
                    "✅ **Điều kiện**:\n" +
                    "  • Sản phẩm còn nguyên tem, hộp\n" +
                    "  • Chưa qua sử dụng\n" +
                    "  • Có hóa đơn mua hàng\n\n" +
                    "💰 **Hoàn tiền**: 3-5 ngày làm việc\n" +
                    "🔄 **Đổi hàng**: Miễn phí đổi 1 lần\n\n" +
                    "📞 Liên hệ hotline để được hỗ trợ nhanh nhất!",
            Type = "text",
            QuickReplies = new List<string> { "🛡️ Bảo hành", "📞 Liên hệ", "🔍 Tìm sản phẩm" }
        };
    }

    private static ChatMessageResponse WarrantyInfo()
    {
        return new ChatMessageResponse
        {
            Reply = "🛡️ **Chính sách bảo hành:**\n\n" +
                    "📅 **Thời gian**: 12-24 tháng tùy sản phẩm\n" +
                    "🔧 **Phạm vi**:\n" +
                    "  • Lỗi do nhà sản xuất\n" +
                    "  • Hỏng hóc không do tác động bên ngoài\n\n" +
                    "❌ **Không bảo hành**:\n" +
                    "  • Rơi vỡ, ngấm nước\n" +
                    "  • Tự ý sửa chữa\n" +
                    "  • Hết hạn bảo hành\n\n" +
                    "📍 Mang sản phẩm kèm phiếu bảo hành đến cửa hàng!",
            Type = "text",
            QuickReplies = new List<string> { "📋 Đổi trả", "📞 Liên hệ", "🔍 Tìm sản phẩm" }
        };
    }

    private static ChatMessageResponse ContactInfo()
    {
        return new ChatMessageResponse
        {
            Reply = "📞 **Thông tin liên hệ TechStore:**\n\n" +
                    "📱 **Hotline**: 1900 xxxx (8h-22h)\n" +
                    "📧 **Email**: support@techstore.vn\n" +
                    "💬 **Chat**: Ngay tại đây!\n" +
                    "📍 **Địa chỉ**: 123 Nguyễn Huệ, Q.1, TP.HCM\n\n" +
                    "⏰ Giờ làm việc: 8h00 - 22h00 (T2-CN)",
            Type = "text",
            QuickReplies = new List<string> { "🚚 Giao hàng", "📋 Đổi trả", "🔍 Tìm sản phẩm" }
        };
    }

    private static ChatMessageResponse HelpMenu()
    {
        return new ChatMessageResponse
        {
            Reply = "❓ **Tôi có thể giúp bạn những gì?**\n\n" +
                    "🔍 **Tìm sản phẩm** - Gõ tên sản phẩm bạn cần\n" +
                    "💰 **Tìm theo giá** - VD: \"sản phẩm 5 triệu\"\n" +
                    "🏷️ **Xem giảm giá** - Sản phẩm đang sale\n" +
                    "📂 **Danh mục** - Xem các loại sản phẩm\n" +
                    "📦 **Đơn hàng** - Theo dõi đơn hàng\n" +
                    "🚚 **Giao hàng** - Chính sách vận chuyển\n" +
                    "💳 **Thanh toán** - Phương thức thanh toán\n" +
                    "🔄 **Đổi trả** - Chính sách đổi trả\n" +
                    "🛡️ **Bảo hành** - Thông tin bảo hành\n" +
                    "📞 **Liên hệ** - Hotline & địa chỉ",
            Type = "text",
            QuickReplies = new List<string>
            {
                "🔍 Gợi ý sản phẩm",
                "🏷️ Sản phẩm giảm giá",
                "📦 Đơn hàng",
                "📋 Chính sách",
                "📞 Liên hệ"
            }
        };
    }

    private static ChatMessageResponse ThankYou()
    {
        return new ChatMessageResponse
        {
            Reply = "Cảm ơn bạn! 😊 Rất vui được hỗ trợ. Nếu cần thêm gì, đừng ngại hỏi tôi nhé! 🛒",
            Type = "text",
            QuickReplies = new List<string> { "🔍 Tìm sản phẩm", "❓ Xem dịch vụ" }
        };
    }

    private static ChatMessageResponse Fallback()
    {
        return new ChatMessageResponse
        {
            Reply = "🤔 Xin lỗi, tôi chưa hiểu ý bạn lắm. Bạn có thể thử:\n\n" +
                    "• Gõ tên sản phẩm cần tìm\n" +
                    "• Hỏi về chính sách (giao hàng, đổi trả...)\n" +
                    "• Gõ \"help\" để xem tất cả dịch vụ",
            Type = "text",
            QuickReplies = new List<string>
            {
                "❓ Xem tất cả dịch vụ",
                "🔍 Gợi ý sản phẩm",
                "📞 Liên hệ hỗ trợ"
            }
        };
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private static string ExtractSearchTerms(string msg)
    {
        // Remove common Vietnamese question words and chatbot triggers
        var cleaned = Regex.Replace(msg,
            @"\b(tôi|tui|muốn|muon|cần|can|tìm|tim|kiếm|kiem|mua|xem|cho|bạn|ban|có|co|không|khong|gì|gi|nào|nao|ơi|oi|nhé|nhe|nhỉ|nhi|vậy|vay|đi|giúp|giup|tư vấn|tu van|gợi ý|goi y|sản phẩm|san pham|recommend|suggest|hãy|hay|được|duoc|thế|the|đó|do|này|nay|về|ve|với|voi|và|va|của|cua|là|la|hay)\b",
            " ", RegexOptions.IgnoreCase);

        cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

        return cleaned.Length >= 2 ? cleaned : msg;
    }

    private static (decimal min, decimal max) ExtractPriceRange(string msg)
    {
        decimal min = 0, max = 0;

        // Match patterns like "5 triệu", "500k", "500 nghìn", "10tr"
        var matches = Regex.Matches(msg, @"(\d+[\.,]?\d*)\s*(triệu|trieu|tr|k|nghìn|nghin|đồng|dong)?", RegexOptions.IgnoreCase);

        var prices = new List<decimal>();
        foreach (Match m in matches)
        {
            if (decimal.TryParse(m.Groups[1].Value.Replace(",", "."), System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var val))
            {
                var unit = m.Groups[2].Value.ToLower();
                val = unit switch
                {
                    "triệu" or "trieu" or "tr" => val * 1_000_000,
                    "k" or "nghìn" or "nghin" => val * 1_000,
                    _ => val > 1000 ? val : val * 1_000_000 // Assume triệu if no unit and small number
                };
                prices.Add(val);
            }
        }

        if (prices.Count >= 2)
        {
            min = prices.Min();
            max = prices.Max();
        }
        else if (prices.Count == 1)
        {
            // Check if "dưới", "under", "tầm" -> set as max
            if (Regex.IsMatch(msg, @"\b(dưới|duoi|under|tầm|tam|khoảng|khoang)\b"))
            {
                max = prices[0];
            }
            else if (Regex.IsMatch(msg, @"\b(trên|tren|trở lên|tro len|từ|tu)\b"))
            {
                min = prices[0];
            }
            else
            {
                // Default: ±20% range
                min = prices[0] * 0.8m;
                max = prices[0] * 1.2m;
            }
        }

        return (min, max);
    }

    private static ChatProductSuggestion MapProduct(Models.Product p)
    {
        return new ChatProductSuggestion
        {
            Id = p.Id,
            Name = p.Name,
            Price = p.Price,
            OriginalPrice = p.OriginalPrice,
            Image = p.ImageUrl,
            Rating = p.Rating,
            Reviews = p.ReviewCount,
            OnSale = p.OnSale,
            Discount = p.Discount
        };
    }
}
