using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Orders;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class OrderService
{
    private readonly MongoDbContext _db;
    private readonly EmailService _email;
    private readonly PaymentService _payment;
    private readonly PromoCodeService _promo;
    private readonly VoucherService _voucher;
    public OrderService(MongoDbContext db, EmailService email, PaymentService payment, PromoCodeService promo, VoucherService voucher)
    {
        _db = db; _email = email; _payment = payment; _promo = promo; _voucher = voucher;
    }

    public async Task<OrderDetailDto> CreateOrder(string? userId, CreateOrderRequest request)
    {
        List<CartItem> cartItems = new();
        if (userId != null)
        {
            cartItems = await _db.CartItems.Find(ci => ci.UserId == userId).ToListAsync();
        }
        else if (request.GuestItems != null && request.GuestItems.Any())
        {
            cartItems = request.GuestItems.Select(g => new CartItem { ProductId = g.ProductId, Quantity = g.Quantity }).ToList();
        }

        if (!cartItems.Any()) throw new InvalidOperationException("Giỏ hàng trống");

        // Load products
        var productIds = cartItems.Select(ci => ci.ProductId).ToList();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id)).ToListAsync();
        var productMap = products.ToDictionary(p => p.Id);

        foreach (var ci in cartItems)
        {
            if (!productMap.TryGetValue(ci.ProductId, out var product))
                throw new InvalidOperationException($"Sản phẩm không tồn tại");
            if (product.Stock < ci.Quantity)
                throw new InvalidOperationException($"Không đủ hàng trong kho cho {product.Name}");
        }

        // (Stripe payment verification moved to after total calculation)

        var subtotal = cartItems.Sum(ci => productMap[ci.ProductId].Price * ci.Quantity);
        var tax = Math.Round(subtotal * 0.1m, 2);
        var shipping = request.ShippingMethod switch { "express" => 20m, "overnight" => 40m, _ => subtotal > 50 ? 0 : 10m };

        decimal discountAmount = 0;
        string? promoCodeId = null;

        if (!string.IsNullOrEmpty(request.PromoCode))
        {
            var promoCode = await _promo.ValidatePromoCode(request.PromoCode);
            if (promoCode.MinOrderValue.HasValue && subtotal < promoCode.MinOrderValue.Value)
                throw new InvalidOperationException($"Đơn hàng phải có giá trị tối thiểu {promoCode.MinOrderValue.Value}");
                
            discountAmount = promoCode.DiscountType == "Percentage" 
                ? Math.Round(subtotal * (promoCode.DiscountValue / 100), 2)
                : promoCode.DiscountValue;
                
            promoCodeId = promoCode.Id;

            await _db.PromoCodes.UpdateOneAsync(p => p.Id == promoCode.Id, Builders<PromoCode>.Update.Inc(p => p.UsedCount, 1));
        }
        else if (!string.IsNullOrEmpty(request.VoucherCode) && userId != null)
        {
            var voucher = await _voucher.UseVoucher(userId, request.VoucherCode);
            if (voucher.MinOrderValue.HasValue && subtotal < voucher.MinOrderValue.Value)
                throw new InvalidOperationException($"Đơn hàng phải có giá trị tối thiểu {voucher.MinOrderValue.Value} để dùng voucher");
                
            discountAmount = voucher.DiscountType == "Percentage"
                ? Math.Round(subtotal * (voucher.DiscountValue / 100), 2)
                : voucher.DiscountValue;
        }

        var total = subtotal - discountAmount + tax + shipping;
        if (total < 0) total = 0;

        // Verify Stripe payment if PaymentIntentId provided
        if (request.PaymentMethod == "credit" && !string.IsNullOrEmpty(request.PaymentIntentId))
        {
            var paid = await _payment.VerifyPayment(request.PaymentIntentId, total, "vnd");
            if (!paid) throw new InvalidOperationException("Thanh toán không hợp lệ (có thể sai số tiền hoặc thanh toán chưa thành công).");
        }

        string paymentStatus = request.PaymentMethod switch
        {
            "credit" => "Đã thanh toán",
            "cod" => "Chưa thanh toán",
            "momo_qr" => "Chờ thanh toán",
            "momo_atm" => "Chờ thanh toán",
            _ => "Chưa thanh toán"
        };

        var order = new Order
        {
            UserId = userId, Status = "Đang xử lý", Subtotal = subtotal, Tax = tax,
            DiscountAmount = discountAmount, PromoCodeId = promoCodeId,
            ShippingCost = shipping, Total = total,
            ShippingName = $"{request.FirstName} {request.LastName}", ShippingAddress = request.Address,
            ShippingCity = request.City, ShippingState = request.State, ShippingZipCode = request.ZipCode,
            ShippingCountry = request.Country, ShippingEmail = request.Email, ShippingMethod = request.ShippingMethod,
            PaymentMethod = request.PaymentMethod, PaymentStatus = paymentStatus,
            TrackingNumber = $"TRK{DateTime.UtcNow.Ticks % 1000000000}", Carrier = "Giao Hàng Nhanh",
            EstimatedDelivery = DateTime.UtcNow.AddDays(request.ShippingMethod == "overnight" ? 1 : request.ShippingMethod == "express" ? 3 : 7),
            Items = cartItems.Select(ci =>
            {
                var product = productMap[ci.ProductId];
                return new OrderItem
                {
                    ProductId = ci.ProductId, ProductName = product.Name,
                    ProductImage = product.ImageUrl, Quantity = ci.Quantity, Price = product.Price
                };
            }).ToList(),
            StatusHistory = new List<OrderStatusHistory>
            {
                new() { Status = "Đã nhận đơn", Location = "Kho hàng, TP. Hồ Chí Minh", Description = "Đơn hàng đã được tiếp nhận và xác nhận" },
                new() { Status = "Đang xử lý", Location = "Kho hàng, TP. Hồ Chí Minh", Description = "Thanh toán đã xác nhận. Đơn hàng đang được đóng gói chuẩn bị giao." }
            }
        };

        // Reduce stock atomically before inserting order
        var successfulReductions = new List<CartItem>();
        try
        {
            foreach (var ci in cartItems)
            {
                var result = await _db.Products.UpdateOneAsync(
                    p => p.Id == ci.ProductId && p.Stock >= ci.Quantity,
                    Builders<Product>.Update.Inc(p => p.Stock, -ci.Quantity));
                
                if (result.ModifiedCount == 0)
                    throw new InvalidOperationException($"Sản phẩm {productMap[ci.ProductId].Name} không đủ hàng trong kho");
                
                successfulReductions.Add(ci);
            }

            await _db.Orders.InsertOneAsync(order);
        }
        catch
        {
            // Rollback successful reductions
            foreach (var ci in successfulReductions)
            {
                await _db.Products.UpdateOneAsync(
                    p => p.Id == ci.ProductId,
                    Builders<Product>.Update.Inc(p => p.Stock, ci.Quantity));
            }
            throw;
        }

        // Clear cart
        if (userId != null)
        {
            await _db.CartItems.DeleteManyAsync(ci => ci.UserId == userId);
        }

        // Send email
        User? user = null;
        if (userId != null)
        {
            user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }

        if (user != null)
        {
            _ = _email.SendOrderConfirmationAsync(order, user); // fire-and-forget
            
            // Add Loyalty points
            int points = (int)Math.Floor(total);
            var newPoints = user.Points + points;
            var oldTier = user.LoyaltyTier;
            var newTier = newPoints >= 1000 ? "Platinum" : newPoints >= 500 ? "Gold" : newPoints >= 100 ? "Silver" : "Bronze";
            
            await _db.Users.UpdateOneAsync(u => u.Id == userId, 
                Builders<User>.Update.Set(u => u.Points, newPoints).Set(u => u.LoyaltyTier, newTier));

            // Auto-grant voucher when tier changes
            if (newTier != oldTier)
                _ = _voucher.AutoGrantTierUpVoucher(userId, newTier);
        }
        else if (!string.IsNullOrEmpty(request.Email))
        {
            // Fallback for guest confirmation email
            var guestUser = new User { Email = request.Email, FirstName = request.FirstName, LastName = request.LastName };
            _ = _email.SendOrderConfirmationAsync(order, guestUser);
        }

        return await GetOrderDetail(userId, order.Id) ?? throw new Exception("Tạo đơn hàng thất bại");
    }

    public async Task CancelOrder(string userId, string orderId)
    {
        var order = await _db.Orders.Find(o => o.Id == orderId && o.UserId == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng");

        if (IsOrderInTransit(order.Status))
            throw new InvalidOperationException("Không thể hủy đơn hàng đã được giao hoặc đang vận chuyển");

        if (order.Status == "Đã hủy") return;

        var history = new OrderStatusHistory { Status = "Đã hủy", Description = "Người dùng đã hủy đơn hàng" };
        var update = Builders<Order>.Update.Set(o => o.Status, "Đã hủy").Push(o => o.StatusHistory, history).Set(o => o.UpdatedAt, DateTime.UtcNow);
        
        await _db.Orders.UpdateOneAsync(o => o.Id == orderId, update);

        // Refund stock
        foreach (var item in order.Items)
        {
            await _db.Products.UpdateOneAsync(p => p.Id == item.ProductId, Builders<Product>.Update.Inc(p => p.Stock, item.Quantity));
        }

        // Send cancellation email
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user != null)
        {
            // Reload order with updated status for email template
            var updatedOrder = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
            if (updatedOrder != null)
                _ = _email.SendOrderCancellationAsync(updatedOrder, user); // fire-and-forget
        }
    }

    public async Task<List<OrderDto>> GetOrders(string userId)
    {
        var orders = await _db.Orders.Find(o => o.UserId == userId)
            .Sort(Builders<Order>.Sort.Descending(o => o.CreatedAt))
            .ToListAsync();

        return orders.Select(o => new OrderDto
        {
            Id = o.Id, Status = o.Status, Total = o.Total,
            ItemCount = o.Items.Count, TrackingNumber = o.TrackingNumber, Date = o.CreatedAt
        }).ToList();
    }

    public async Task<OrderDetailDto?> GetOrderDetail(string? userId, string orderId)
    {
        var filter = Builders<Order>.Filter.Eq(x => x.Id, orderId);
        if (userId != null) {
            filter &= Builders<Order>.Filter.Eq(x => x.UserId, userId);
        } else {
            filter &= Builders<Order>.Filter.Eq(x => x.UserId, null);
        }
        var o = await _db.Orders.Find(filter).FirstOrDefaultAsync();
        if (o == null) return null;

        return new OrderDetailDto
        {
            Id = o.Id, Status = o.Status, Subtotal = o.Subtotal, DiscountAmount = o.DiscountAmount, Tax = o.Tax,
            ShippingCost = o.ShippingCost, Total = o.Total, Date = o.CreatedAt,
            Items = o.Items.Select(i => new OrderItemDto
            {
                Id = i.ProductId, Name = i.ProductName, Image = i.ProductImage, Quantity = i.Quantity, Price = i.Price
            }).ToList(),
            Shipping = new ShippingInfoDto
            {
                Name = o.ShippingName ?? "", Address = $"{o.ShippingAddress}, {o.ShippingCity}, {o.ShippingState} {o.ShippingZipCode}, {o.ShippingCountry}",
                Phone = o.ShippingPhone, Email = o.ShippingEmail,
                Method = GetShippingMethodLabel(o.ShippingMethod)
            },
            Tracking = o.TrackingNumber != null ? new TrackingInfoDto
            {
                Number = o.TrackingNumber, Carrier = o.Carrier, Status = o.Status,
                EstimatedDelivery = o.EstimatedDelivery,
                Events = o.StatusHistory.OrderByDescending(h => h.CreatedAt).Select(h => new TrackingEventDto
                {
                    Date = h.CreatedAt, Location = h.Location, Status = h.Status, Description = h.Description
                }).ToList()
            } : null
        };
    }

    public async Task<object> GetOrderHistoryByPhone(string phone)
    {
        var normalizedPhone = phone.Replace(" ", "").Replace("-", "");

        // MongoDB LINQ doesn't support String.Replace(), so use regex to find candidates then filter in memory
        var regex = new MongoDB.Bson.BsonRegularExpression(normalizedPhone);
        var users = await _db.Users.Find(u => u.Phone != null).ToListAsync();
        var user = users.FirstOrDefault(u => u.Phone != null && u.Phone.Replace(" ", "").Replace("-", "") == normalizedPhone)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng với số điện thoại này");

        var orders = await _db.Orders.Find(o => o.UserId == user.Id)
            .Sort(Builders<Order>.Sort.Descending(o => o.CreatedAt))
            .ToListAsync();

        return new
        {
            customerName = $"{user.FirstName} {user.LastName}",
            phone = user.Phone,
            totalOrders = orders.Count,
            totalSpent = orders.Where(o => o.Status != "Đã hủy" && o.Status != "Cancelled").Sum(o => o.Total),
            orders = orders.Select(o => new
            {
                id = o.Id,
                status = o.Status,
                total = o.Total,
                itemCount = o.Items.Count,
                trackingNumber = o.TrackingNumber,
                date = o.CreatedAt,
                items = o.Items.Select(i => new
                {
                    name = i.ProductName,
                    image = i.ProductImage,
                    quantity = i.Quantity,
                    price = i.Price
                }).ToList()
            }).ToList()
        };
    }

    private static bool IsOrderInTransit(string? status) =>
        status is "Shipped" or "Delivered" or "Đang vận chuyển" or "Đã giao";

    private static string GetShippingMethodLabel(string? shippingMethod) => shippingMethod switch
    {
        "express" => "Giao hàng nhanh (2-3 ngày)",
        "overnight" => "Giao hàng hỏa tốc (1 ngày)",
        _ => "Giao hàng tiêu chuẩn (5-7 ngày)"
    };

    public async Task<Order?> GetOrderByIdRaw(string orderId)
    {
        return await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync();
    }

    public async Task UpdatePaymentStatus(string orderId, string paymentStatus)
    {
        var history = new OrderStatusHistory { Status = "Cập nhật thanh toán", Description = $"Thanh toán cập nhật thành: {paymentStatus}" };
        var update = Builders<Order>.Update
            .Set(o => o.PaymentStatus, paymentStatus)
            .Push(o => o.StatusHistory, history)
            .Set(o => o.UpdatedAt, DateTime.UtcNow);

        await _db.Orders.UpdateOneAsync(o => o.Id == orderId, update);
    }
}
