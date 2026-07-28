using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Admin;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class AdminService
{
    private readonly MongoDbContext _db;
    private readonly EmailService _email;
    public AdminService(MongoDbContext db, EmailService email) { _db = db; _email = email; }

    // ── Dashboard ─────────────────────────────────────────────────────────
    public async Task<DashboardStatsDto> GetDashboardStats()
    {
        var allOrders = await _db.Orders.Find(_ => true).ToListAsync();

        var totalRevenue = allOrders.Where(o => o.Status != "Cancelled").Sum(o => o.Total);

        var orderCounts = allOrders.GroupBy(o => o.Status ?? "Unknown")
            .ToDictionary(g => g.Key, g => g.Count());

        int Count(string s) => orderCounts.GetValueOrDefault(s, 0);

        var recentOrders = allOrders.OrderByDescending(o => o.CreatedAt).Take(10).ToList();

        // Load users for recent orders
        var userIds = recentOrders.Select(o => o.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        var recentOrderDtos = recentOrders.Select(o =>
        {
            var user = !string.IsNullOrEmpty(o.UserId) ? userMap.GetValueOrDefault(o.UserId) : null;
            return new RecentOrderDto
            {
                Id = o.Id,
                CustomerName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                CustomerEmail = user?.Email ?? "",
                Total = o.Total,
                Status = o.Status,
                Date = o.CreatedAt,
                ItemCount = o.Items.Count
            };
        }).ToList();

        // Top products from all order items
        var allItems = allOrders.Where(o => o.Status != "Cancelled")
            .SelectMany(o => o.Items)
            .GroupBy(i => new { i.ProductId, i.ProductName, i.ProductImage })
            .Select(g => new TopProductDto
            {
                Id = g.Key.ProductId,
                Name = g.Key.ProductName,
                Image = g.Key.ProductImage,
                TotalSold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.Price * x.Quantity)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(5)
            .ToList();

        // Fill prices from Products
        foreach (var tp in allItems)
        {
            var p = await _db.Products.Find(x => x.Id == tp.Id).FirstOrDefaultAsync();
            if (p != null) tp.Price = p.Price;
        }

        var totalProducts = await _db.Products.CountDocumentsAsync(p => p.IsActive);
        var totalUsers = await _db.Users.CountDocumentsAsync(_ => true);

        return new DashboardStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = allOrders.Count,
            TotalProducts = (int)totalProducts,
            TotalUsers = (int)totalUsers,
            PendingOrders = Count("Pending"),
            ProcessingOrders = Count("Processing"),
            ShippedOrders = Count("Shipped"),
            DeliveredOrders = Count("Delivered"),
            RecentOrders = recentOrderDtos,
            TopProducts = allItems
        };
    }

    // ── Revenue Report ────────────────────────────────────────────────────
    public async Task<RevenueReportDto> GetRevenueReport(DateTime from, DateTime to, string? paymentMethod = null)
    {
        var builder = Builders<Order>.Filter;
        var filter = builder.Gte(o => o.CreatedAt, from)
                  & builder.Lte(o => o.CreatedAt, to)
                  & builder.Ne(o => o.Status, "Cancelled");

        if (!string.IsNullOrEmpty(paymentMethod))
            filter &= builder.Eq(o => o.PaymentMethod, paymentMethod);

        var orders = await _db.Orders.Find(filter)
            .Sort(Builders<Order>.Sort.Ascending(o => o.CreatedAt))
            .ToListAsync();

        var totalRevenue = orders.Sum(o => o.Total);
        var totalOrders = orders.Count;
        var avgOrderValue = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 0) : 0;

        // Daily breakdown
        var daily = orders
            .GroupBy(o => o.CreatedAt.ToString("yyyy-MM-dd"))
            .Select(g => new RevenueDailyDto
            {
                Date = g.Key,
                Revenue = g.Sum(o => o.Total),
                OrderCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        // By payment method
        var byPayment = orders
            .GroupBy(o => o.PaymentMethod)
            .Select(g => new RevenueByPaymentMethodDto
            {
                PaymentMethod = g.Key,
                Revenue = g.Sum(o => o.Total),
                OrderCount = g.Count(),
                Percentage = totalRevenue > 0
                    ? Math.Round(g.Sum(o => o.Total) / totalRevenue * 100, 1)
                    : 0
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        return new RevenueReportDto
        {
            From = from,
            To = to,
            PaymentMethodFilter = paymentMethod,
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AverageOrderValue = avgOrderValue,
            DailyBreakdown = daily,
            ByPaymentMethod = byPayment
        };
    }

    // ── Orders ────────────────────────────────────────────────────────────
    public async Task<List<AdminOrderDto>> GetAllOrders(string? status = null)
    {
        var filter = status != null
            ? Builders<Order>.Filter.Eq(o => o.Status, status)
            : Builders<Order>.Filter.Empty;

        var orders = await _db.Orders.Find(filter)
            .Sort(Builders<Order>.Sort.Descending(o => o.CreatedAt))
            .ToListAsync();

        var userIds = orders.Select(o => o.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        return orders.Select(o =>
        {
            var user = !string.IsNullOrEmpty(o.UserId) ? userMap.GetValueOrDefault(o.UserId) : null;
            return new AdminOrderDto
            {
                Id = o.Id,
                CustomerName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                CustomerEmail = user?.Email ?? "",
                Total = o.Total,
                Status = o.Status,
                PaymentStatus = o.PaymentStatus,
                ShippingMethod = o.ShippingMethod,
                TrackingNumber = o.TrackingNumber,
                ItemCount = o.Items.Count,
                Date = o.CreatedAt
            };
        }).ToList();
    }

    public async Task<AdminOrderDto> UpdateOrderStatus(string orderId, UpdateOrderStatusRequest request)
    {
        var order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Order not found");

        var statusEntry = new OrderStatusHistory
        {
            Status = request.Status,
            Location = request.Location,
            Description = request.Description ?? $"Order status updated to {request.Status}"
        };

        await _db.Orders.UpdateOneAsync(
            o => o.Id == orderId,
            Builders<Order>.Update
                .Set(o => o.Status, request.Status)
                .Set(o => o.UpdatedAt, DateTime.UtcNow)
                .Push(o => o.StatusHistory, statusEntry));

        // Reload order
        order = await _db.Orders.Find(o => o.Id == orderId).FirstOrDefaultAsync()!;
        var user = await _db.Users.Find(u => u.Id == order!.UserId).FirstOrDefaultAsync();

        // Send email notification
        if (user != null)
            _ = _email.SendOrderStatusUpdateAsync(order!, user); // fire-and-forget

        return new AdminOrderDto
        {
            Id = order!.Id,
            CustomerName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
            CustomerEmail = user?.Email ?? "",
            Total = order.Total,
            Status = order.Status,
            PaymentStatus = order.PaymentStatus,
            ShippingMethod = order.ShippingMethod,
            TrackingNumber = order.TrackingNumber,
            ItemCount = order.Items.Count,
            Date = order.CreatedAt
        };
    }

    // ── Products ──────────────────────────────────────────────────────────
    public async Task<List<AdminProductDto>> GetAllProducts(string? search = null)
    {
        var filter = search != null
            ? Builders<Product>.Filter.Regex(p => p.Name, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            : Builders<Product>.Filter.Empty;

        var products = await _db.Products.Find(filter)
            .Sort(Builders<Product>.Sort.Descending(p => p.CreatedAt))
            .ToListAsync();

        var categoryIds = products.Select(p => p.CategoryId).Distinct().ToList();
        var categories = await _db.Categories.Find(c => categoryIds.Contains(c.Id)).ToListAsync();
        var categoryMap = categories.ToDictionary(c => c.Id, c => c.Name);

        return products.Select(p => new AdminProductDto
        {
            Id = p.Id, Name = p.Name, Price = p.Price, OriginalPrice = p.OriginalPrice,
            Image = p.ImageUrl, Category = categoryMap.GetValueOrDefault(p.CategoryId, ""),
            CategoryId = p.CategoryId, Stock = p.Stock, Rating = p.Rating,
            ReviewCount = p.ReviewCount, OnSale = p.OnSale, Discount = p.Discount,
            Brand = p.Brand, IsActive = p.IsActive, CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<AdminProductDto> CreateProduct(CreateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name, Description = request.Description,
            Price = request.Price, OriginalPrice = request.OriginalPrice,
            ImageUrl = request.ImageUrl, CategoryId = request.CategoryId,
            Stock = request.Stock, OnSale = request.OnSale, Discount = request.Discount,
            Brand = request.Brand, Model = request.Model, Color = request.Color,
            Weight = request.Weight, Warranty = request.Warranty
        };
        await _db.Products.InsertOneAsync(product);

        var category = await _db.Categories.Find(c => c.Id == product.CategoryId).FirstOrDefaultAsync();
        return new AdminProductDto
        {
            Id = product.Id, Name = product.Name, Price = product.Price,
            OriginalPrice = product.OriginalPrice, Image = product.ImageUrl,
            Category = category?.Name ?? "", CategoryId = product.CategoryId,
            Stock = product.Stock, OnSale = product.OnSale, Discount = product.Discount,
            Brand = product.Brand, IsActive = product.IsActive, CreatedAt = product.CreatedAt
        };
    }

    public async Task<AdminProductDto> UpdateProduct(string id, CreateProductRequest request)
    {
        var product = await _db.Products.Find(p => p.Id == id).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Product not found");

        await _db.Products.UpdateOneAsync(
            p => p.Id == id,
            Builders<Product>.Update
                .Set(p => p.Name, request.Name)
                .Set(p => p.Description, request.Description)
                .Set(p => p.Price, request.Price)
                .Set(p => p.OriginalPrice, request.OriginalPrice)
                .Set(p => p.ImageUrl, request.ImageUrl)
                .Set(p => p.CategoryId, request.CategoryId)
                .Set(p => p.Stock, request.Stock)
                .Set(p => p.OnSale, request.OnSale)
                .Set(p => p.Discount, request.Discount)
                .Set(p => p.Brand, request.Brand)
                .Set(p => p.Model, request.Model)
                .Set(p => p.Color, request.Color)
                .Set(p => p.Weight, request.Weight)
                .Set(p => p.Warranty, request.Warranty));

        product = await _db.Products.Find(p => p.Id == id).FirstOrDefaultAsync()!;
        var category = await _db.Categories.Find(c => c.Id == product!.CategoryId).FirstOrDefaultAsync();

        return new AdminProductDto
        {
            Id = product!.Id, Name = product.Name, Price = product.Price,
            OriginalPrice = product.OriginalPrice, Image = product.ImageUrl,
            Category = category?.Name ?? "", CategoryId = product.CategoryId,
            Stock = product.Stock, OnSale = product.OnSale, Discount = product.Discount,
            Brand = product.Brand, IsActive = product.IsActive, CreatedAt = product.CreatedAt
        };
    }

    public async Task ToggleProductActive(string id)
    {
        var product = await _db.Products.Find(p => p.Id == id).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Product not found");

        await _db.Products.UpdateOneAsync(
            p => p.Id == id,
            Builders<Product>.Update.Set(p => p.IsActive, !product.IsActive));
    }

    // ── Users ─────────────────────────────────────────────────────────────
    public async Task<List<AdminUserDto>> GetAllUsers()
    {
        var users = await _db.Users.Find(_ => true).ToListAsync();
        var result = new List<AdminUserDto>();

        foreach (var u in users)
        {
            var orderCount = await _db.Orders.CountDocumentsAsync(o => o.UserId == u.Id);
            result.Add(new AdminUserDto
            {
                Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName,
                Phone = u.Phone, Role = u.Role, OrderCount = (int)orderCount,
                IsLocked = u.IsLocked, LockedAt = u.LockedAt, LockReason = u.LockReason,
                CreatedAt = u.CreatedAt
            });
        }
        return result;
    }

    public async Task LockUser(string userId, string? reason)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        if (user.Role == "Admin")
            throw new InvalidOperationException("Không thể khóa tài khoản Admin");

        await _db.Users.UpdateOneAsync(
            u => u.Id == userId,
            Builders<User>.Update
                .Set(u => u.IsLocked, true)
                .Set(u => u.LockedAt, DateTime.UtcNow)
                .Set(u => u.LockReason, reason));
    }

    public async Task UnlockUser(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        await _db.Users.UpdateOneAsync(
            u => u.Id == userId,
            Builders<User>.Update
                .Set(u => u.IsLocked, false)
                .Set(u => u.LockedAt, (DateTime?)null)
                .Set(u => u.LockReason, (string?)null));
    }

    public async Task DeleteUser(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        if (user.Role == "Admin")
            throw new InvalidOperationException("Không thể xóa tài khoản Admin");

        // Cascade: remove related data
        await _db.CartItems.DeleteManyAsync(ci => ci.UserId == userId);
        await _db.WishlistItems.DeleteManyAsync(wi => wi.UserId == userId);
        await _db.Addresses.DeleteManyAsync(a => a.UserId == userId);
        await _db.Reviews.DeleteManyAsync(r => r.UserId == userId);

        await _db.Users.DeleteOneAsync(u => u.Id == userId);
    }

    // ── Admin Reset Password ──────────────────────────────────────────────
    public async Task AdminResetPassword(string userId, string newPassword)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        if (user.Role == "Admin")
            throw new InvalidOperationException("Không thể đổi mật khẩu tài khoản Admin khác");

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự");

        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _db.Users.UpdateOneAsync(
            u => u.Id == userId,
            Builders<User>.Update.Set(u => u.PasswordHash, hash));
    }

    // ── Order History by Phone ─────────────────────────────────────────────
    public async Task<OrderHistoryByPhoneDto> GetOrderHistoryByPhone(string phone)
    {
        // Normalize phone: remove spaces and dashes
        var normalizedPhone = phone.Replace(" ", "").Replace("-", "");

        // MongoDB LINQ doesn't support String.Replace(), so load users and filter in memory
        var users = await _db.Users.Find(u => u.Phone != null).ToListAsync();
        var user = users.FirstOrDefault(u => u.Phone != null && u.Phone.Replace(" ", "").Replace("-", "") == normalizedPhone)
            ?? throw new KeyNotFoundException("Không tìm thấy khách hàng với số điện thoại này");

        var orders = await _db.Orders.Find(o => o.UserId == user.Id)
            .Sort(Builders<Order>.Sort.Descending(o => o.CreatedAt))
            .ToListAsync();

        return new OrderHistoryByPhoneDto
        {
            CustomerId = user.Id,
            CustomerName = $"{user.FirstName} {user.LastName}",
            CustomerEmail = user.Email,
            Phone = user.Phone,
            Orders = orders.Select(o => new AdminOrderDto
            {
                Id = o.Id,
                CustomerName = $"{user.FirstName} {user.LastName}",
                CustomerEmail = user.Email,
                Total = o.Total,
                Status = o.Status,
                PaymentStatus = o.PaymentStatus,
                ShippingMethod = o.ShippingMethod,
                TrackingNumber = o.TrackingNumber,
                ItemCount = o.Items.Count,
                Date = o.CreatedAt
            }).ToList()
        };
    }

    // ── Categories CRUD ───────────────────────────────────────────────────
    public async Task<List<AdminCategoryDto>> GetAllCategories()
    {
        var categories = await _db.Categories.Find(_ => true).ToListAsync();
        var result = new List<AdminCategoryDto>();

        foreach (var c in categories)
        {
            var productCount = await _db.Products.CountDocumentsAsync(p => p.CategoryId == c.Id);
            result.Add(new AdminCategoryDto
            {
                Id = c.Id, Name = c.Name, Slug = c.Slug,
                Description = c.Description, ImageUrl = c.ImageUrl,
                ProductCount = (int)productCount
            });
        }
        return result;
    }

    public async Task<AdminCategoryDto> CreateCategory(CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Slug = request.Slug,
            Description = request.Description,
            ImageUrl = request.ImageUrl
        };
        await _db.Categories.InsertOneAsync(category);

        return new AdminCategoryDto
        {
            Id = category.Id, Name = category.Name, Slug = category.Slug,
            Description = category.Description, ImageUrl = category.ImageUrl, ProductCount = 0
        };
    }

    public async Task<AdminCategoryDto> UpdateCategory(string id, CreateCategoryRequest request)
    {
        var category = await _db.Categories.Find(c => c.Id == id).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Danh mục không tồn tại");

        await _db.Categories.UpdateOneAsync(
            c => c.Id == id,
            Builders<Category>.Update
                .Set(c => c.Name, request.Name)
                .Set(c => c.Slug, request.Slug)
                .Set(c => c.Description, request.Description)
                .Set(c => c.ImageUrl, request.ImageUrl));

        var productCount = await _db.Products.CountDocumentsAsync(p => p.CategoryId == id);

        return new AdminCategoryDto
        {
            Id = id, Name = request.Name, Slug = request.Slug,
            Description = request.Description, ImageUrl = request.ImageUrl,
            ProductCount = (int)productCount
        };
    }

    public async Task DeleteCategory(string id)
    {
        var category = await _db.Categories.Find(c => c.Id == id).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Danh mục không tồn tại");

        var productCount = await _db.Products.CountDocumentsAsync(p => p.CategoryId == id);
        if (productCount > 0)
            throw new InvalidOperationException($"Không thể xóa: danh mục đang chứa {productCount} sản phẩm");

        await _db.Categories.DeleteOneAsync(c => c.Id == id);
    }

    // ── Inventory (Nhập/Xuất Kho) ─────────────────────────────────────────
    public async Task<List<StockTransactionDto>> GetStockTransactions(string? productId = null, string? type = null)
    {
        var builder = Builders<StockTransaction>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrEmpty(productId)) filter &= builder.Eq(t => t.ProductId, productId);
        if (!string.IsNullOrEmpty(type)) filter &= builder.Eq(t => t.Type, type);

        var transactions = await _db.StockTransactions.Find(filter)
            .Sort(Builders<StockTransaction>.Sort.Descending(t => t.CreatedAt))
            .Limit(200)
            .ToListAsync();

        return transactions.Select(t => new StockTransactionDto
        {
            Id = t.Id, ProductId = t.ProductId, ProductName = t.ProductName,
            Type = t.Type, Quantity = t.Quantity, StockBefore = t.StockBefore,
            StockAfter = t.StockAfter, Reason = t.Reason, Note = t.Note,
            CreatedBy = t.CreatedBy, CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<StockTransactionDto> CreateStockTransaction(string adminUserId, CreateStockTransactionRequest request)
    {
        var product = await _db.Products.Find(p => p.Id == request.ProductId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Sản phẩm không tồn tại");

        if (request.Quantity <= 0)
            throw new InvalidOperationException("Số lượng phải lớn hơn 0");

        if (request.Type != "import" && request.Type != "export")
            throw new InvalidOperationException("Loại giao dịch phải là 'import' hoặc 'export'");

        var stockBefore = product.Stock;
        int stockAfter;

        if (request.Type == "import")
        {
            stockAfter = stockBefore + request.Quantity;
        }
        else // export
        {
            if (product.Stock < request.Quantity)
                throw new InvalidOperationException($"Tồn kho không đủ. Hiện có: {product.Stock}, yêu cầu xuất: {request.Quantity}");
            stockAfter = stockBefore - request.Quantity;
        }

        // Update product stock
        await _db.Products.UpdateOneAsync(
            p => p.Id == request.ProductId,
            Builders<Product>.Update.Set(p => p.Stock, stockAfter));

        // Create transaction record
        var transaction = new StockTransaction
        {
            ProductId = request.ProductId,
            ProductName = product.Name,
            Type = request.Type,
            Quantity = request.Quantity,
            StockBefore = stockBefore,
            StockAfter = stockAfter,
            Reason = request.Reason,
            Note = request.Note,
            CreatedBy = adminUserId
        };
        await _db.StockTransactions.InsertOneAsync(transaction);

        return new StockTransactionDto
        {
            Id = transaction.Id, ProductId = transaction.ProductId, ProductName = transaction.ProductName,
            Type = transaction.Type, Quantity = transaction.Quantity, StockBefore = transaction.StockBefore,
            StockAfter = transaction.StockAfter, Reason = transaction.Reason, Note = transaction.Note,
            CreatedBy = transaction.CreatedBy, CreatedAt = transaction.CreatedAt
        };
    }

    // ── Customer Care: Reviews ────────────────────────────────────────────
    public async Task<List<AdminReviewDto>> GetAllReviews()
    {
        var reviews = await _db.Reviews.Find(_ => true)
            .Sort(Builders<Review>.Sort.Descending(r => r.CreatedAt))
            .ToListAsync();

        var userIds = reviews.Select(r => r.UserId).Distinct().ToList();
        var productIds = reviews.Select(r => r.ProductId).Distinct().ToList();

        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var products = await _db.Products.Find(p => productIds.Contains(p.Id)).ToListAsync();

        var userMap = users.ToDictionary(u => u.Id);
        var productMap = products.ToDictionary(p => p.Id);

        return reviews.Select(r =>
        {
            var user = userMap.GetValueOrDefault(r.UserId);
            var product = productMap.GetValueOrDefault(r.ProductId);
            return new AdminReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Title = r.Title,
                Comment = r.Comment,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                UserEmail = user?.Email ?? "",
                ProductName = product?.Name ?? "Unknown",
                ProductId = r.ProductId,
                CreatedAt = r.CreatedAt
            };
        }).ToList();
    }

    public async Task DeleteReview(string reviewId)
    {
        var review = await _db.Reviews.Find(r => r.Id == reviewId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Đánh giá không tồn tại");

        await _db.Reviews.DeleteOneAsync(r => r.Id == reviewId);

        // Recalculate product rating
        var allRatings = await _db.Reviews.Find(r => r.ProductId == review.ProductId)
            .Project(r => r.Rating).ToListAsync();

        if (allRatings.Any())
        {
            var avgRating = Math.Round((decimal)allRatings.Average(), 2);
            await _db.Products.UpdateOneAsync(
                p => p.Id == review.ProductId,
                Builders<Product>.Update
                    .Set(p => p.Rating, avgRating)
                    .Set(p => p.ReviewCount, allRatings.Count));
        }
        else
        {
            await _db.Products.UpdateOneAsync(
                p => p.Id == review.ProductId,
                Builders<Product>.Update
                    .Set(p => p.Rating, 0m)
                    .Set(p => p.ReviewCount, 0));
        }
    }

    // ── Customer Care: Support Tickets ─────────────────────────────────────
    public async Task<List<AdminSupportTicketDto>> GetAllSupportTickets(string? status = null, string? type = null)
    {
        var builder = Builders<SupportTicket>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrEmpty(status)) filter &= builder.Eq(t => t.Status, status);
        if (!string.IsNullOrEmpty(type)) filter &= builder.Eq(t => t.Type, type);

        var tickets = await _db.SupportTickets.Find(filter)
            .Sort(Builders<SupportTicket>.Sort.Descending(t => t.CreatedAt))
            .ToListAsync();

        var userIds = tickets.Select(t => t.UserId).Distinct().ToList();
        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        return tickets.Select(t =>
        {
            var user = userMap.GetValueOrDefault(t.UserId);
            return new AdminSupportTicketDto
            {
                Id = t.Id,
                Subject = t.Subject,
                Message = t.Message,
                Status = t.Status,
                Type = t.Type,
                UserName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown",
                UserEmail = user?.Email ?? "",
                ResponseCount = t.Responses.Count,
                Responses = t.Responses.Select(r => new TicketResponseDto
                {
                    Message = r.Message,
                    RespondedBy = r.RespondedBy,
                    IsAdmin = r.IsAdmin,
                    CreatedAt = r.CreatedAt
                }).ToList(),
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            };
        }).ToList();
    }
}

