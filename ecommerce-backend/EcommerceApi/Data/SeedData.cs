using MongoDB.Driver;
using EcommerceApi.Models;
using System.Text.Json;

namespace EcommerceApi.Data;

public static class SeedData
{
    public static async Task InitializeAsync(MongoDbContext context)
    {
        // Skip if already seeded
        if (await context.Products.CountDocumentsAsync(FilterDefinition<Product>.Empty) > 0)
            return;

        // Categories
        var categories = new List<Category>
        {
            new() { Name = "Electronics", Slug = "electronics", Description = "Electronic devices and gadgets" },
            new() { Name = "Accessories", Slug = "accessories", Description = "Phone and computer accessories" },
            new() { Name = "Storage", Slug = "storage", Description = "Storage devices and solutions" },
            new() { Name = "Wearables", Slug = "wearables", Description = "Smart watches and fitness trackers" },
            new() { Name = "Audio", Slug = "audio", Description = "Headphones, speakers, and audio equipment" },
        };
        await context.Categories.InsertManyAsync(categories);

        var electronics = categories[0].Id;
        var accessories = categories[1].Id;
        var storage = categories[2].Id;
        var wearables = categories[3].Id;
        var audio = categories[4].Id;

        // Products
        var products = new List<Product>
        {
            new() { Name = "Premium Wireless Headphones", Price = 299.99m, OriginalPrice = 399.99m,
                ImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", CategoryId = audio,
                Rating = 5, ReviewCount = 128, OnSale = true, Discount = 25, Stock = 15, Brand = "TechAudio", Model = "TA-2000X",
                Color = "Black", Weight = "250g", Warranty = "2 years",
                Description = "Experience premium sound quality with our professional-grade wireless headphones. Featuring active noise cancellation, 40-hour battery life, and Bluetooth 5.2.",
                Features = JsonSerializer.Serialize(new[] { "Active Noise Cancellation (ANC)", "40-hour battery life", "Bluetooth 5.2 connectivity", "Premium noise-isolating earbuds", "Built-in microphone for calls", "Comfortable over-ear design" }) },
            new() { Name = "Smart Watch Pro", Price = 199.99m, ImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
                CategoryId = wearables, Rating = 4, ReviewCount = 95, Stock = 8, Brand = "WearTech", Model = "SW-500",
                Description = "Stay connected with the Smart Watch Pro. Track fitness, receive notifications, and more.",
                Features = JsonSerializer.Serialize(new[] { "Heart rate monitor", "GPS tracking", "Water resistant 50m", "7-day battery", "AMOLED display" }) },
            new() { Name = "USB-C Fast Charger", Price = 49.99m, OriginalPrice = 79.99m,
                ImageUrl = "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600", CategoryId = accessories,
                Rating = 5, ReviewCount = 312, OnSale = true, Discount = 37, Stock = 50, Brand = "ChargePro",
                Description = "65W USB-C fast charger compatible with laptops, phones, and tablets.",
                Features = JsonSerializer.Serialize(new[] { "65W fast charging", "USB-C PD 3.0", "Universal compatibility", "Compact design", "Overcharge protection" }) },
            new() { Name = "Portable SSD 1TB", Price = 129.99m, ImageUrl = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600",
                CategoryId = storage, Rating = 4, ReviewCount = 67, Stock = 0, Brand = "DataVault",
                Description = "Ultra-fast portable SSD with 1TB storage. Transfer speeds up to 1050MB/s.",
                Features = JsonSerializer.Serialize(new[] { "1TB capacity", "1050MB/s read speed", "USB 3.2 Gen 2", "Shock resistant", "Compact aluminum body" }) },
            new() { Name = "Bluetooth Speaker", Price = 79.99m, OriginalPrice = 99.99m,
                ImageUrl = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600", CategoryId = audio,
                Rating = 4, ReviewCount = 203, OnSale = true, Discount = 20, Stock = 30, Brand = "SoundWave",
                Description = "Portable waterproof Bluetooth speaker with 360-degree sound." },
            new() { Name = "Mechanical Keyboard RGB", Price = 149.99m, ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                CategoryId = accessories, Rating = 5, ReviewCount = 89, Stock = 25, Brand = "KeyMaster",
                Description = "Premium mechanical keyboard with Cherry MX switches and per-key RGB lighting." },
            new() { Name = "4K Webcam Pro", Price = 89.99m, ImageUrl = "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600",
                CategoryId = electronics, Rating = 4, ReviewCount = 156, Stock = 18, Brand = "ClearView",
                Description = "Ultra HD 4K webcam with auto-focus and noise-cancelling microphone." },
            new() { Name = "Wireless Mouse Ergonomic", Price = 59.99m, OriginalPrice = 79.99m,
                ImageUrl = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600", CategoryId = accessories,
                Rating = 4, ReviewCount = 234, OnSale = true, Discount = 25, Stock = 40, Brand = "ErgoClick",
                Description = "Ergonomic wireless mouse designed for all-day comfort." },
            new() { Name = "Laptop Stand Adjustable", Price = 39.99m, ImageUrl = "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600",
                CategoryId = accessories, Rating = 5, ReviewCount = 178, Stock = 60, Brand = "DeskPro",
                Description = "Adjustable aluminum laptop stand for improved ergonomics." },
            new() { Name = "Noise Cancelling Earbuds", Price = 179.99m, OriginalPrice = 229.99m,
                ImageUrl = "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600", CategoryId = audio,
                Rating = 5, ReviewCount = 445, OnSale = true, Discount = 22, Stock = 35, Brand = "TechAudio",
                Description = "True wireless earbuds with active noise cancellation and transparency mode." },
            new() { Name = "Gaming Monitor 27\"", Price = 449.99m, ImageUrl = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
                CategoryId = electronics, Rating = 5, ReviewCount = 76, Stock = 10, Brand = "VisionX",
                Description = "27-inch QHD gaming monitor with 165Hz refresh rate and 1ms response time." },
            new() { Name = "External SSD 2TB", Price = 199.99m, ImageUrl = "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600",
                CategoryId = storage, Rating = 4, ReviewCount = 45, Stock = 22, Brand = "DataVault",
                Description = "High-capacity 2TB external SSD with hardware encryption." },
            new() { Name = "Smart Fitness Band", Price = 49.99m, ImageUrl = "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600",
                CategoryId = wearables, Rating = 3, ReviewCount = 189, Stock = 100, Brand = "FitTrack",
                Description = "Affordable fitness tracker with heart rate, sleep tracking, and 14-day battery." },
            new() { Name = "USB-C Hub 7-in-1", Price = 69.99m, OriginalPrice = 89.99m,
                ImageUrl = "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600", CategoryId = accessories,
                Rating = 4, ReviewCount = 267, OnSale = true, Discount = 22, Stock = 45, Brand = "ConnectAll",
                Description = "7-in-1 USB-C hub with HDMI 4K, USB 3.0, SD card reader, and PD charging." },
            new() { Name = "Wireless Charging Pad", Price = 29.99m, ImageUrl = "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=600",
                CategoryId = accessories, Rating = 4, ReviewCount = 312, Stock = 80, Brand = "ChargePro",
                Description = "15W fast wireless charging pad compatible with all Qi-enabled devices." },
            new() { Name = "Smart Home Speaker", Price = 129.99m, ImageUrl = "https://images.unsplash.com/photo-1543512214-318c7553f230?w=600",
                CategoryId = audio, Rating = 4, ReviewCount = 198, Stock = 20, Brand = "SoundWave",
                Description = "Smart speaker with voice assistant, multi-room audio, and premium sound." },
            new() { Name = "Portable Power Bank 20000mAh", Price = 44.99m, OriginalPrice = 59.99m,
                ImageUrl = "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600", CategoryId = accessories,
                Rating = 5, ReviewCount = 523, OnSale = true, Discount = 25, Stock = 70, Brand = "ChargePro",
                Description = "20000mAh power bank with 65W PD fast charging for laptops and phones." },
            new() { Name = "Tablet Stand Pro", Price = 34.99m, ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
                CategoryId = accessories, Rating = 4, ReviewCount = 87, Stock = 55, Brand = "DeskPro",
                Description = "Premium aluminum tablet stand with 360-degree rotation." },
            new() { Name = "Smart Watch Lite", Price = 99.99m, ImageUrl = "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                CategoryId = wearables, Rating = 4, ReviewCount = 342, Stock = 45, Brand = "WearTech",
                Description = "Lightweight smart watch with essential health tracking features." },
            new() { Name = "Studio Headphones", Price = 349.99m, ImageUrl = "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",
                CategoryId = audio, Rating = 5, ReviewCount = 56, Stock = 5, Brand = "TechAudio",
                Description = "Professional studio-grade headphones for music production and mixing." },
            new() { Name = "MicroSD Card 256GB", Price = 34.99m, OriginalPrice = 49.99m,
                ImageUrl = "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=600", CategoryId = storage,
                Rating = 5, ReviewCount = 678, OnSale = true, Discount = 30, Stock = 150, Brand = "DataVault",
                Description = "High-speed 256GB MicroSD card, ideal for cameras and phones." },
            new() { Name = "Desk LED Light Bar", Price = 54.99m, ImageUrl = "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600",
                CategoryId = accessories, Rating = 4, ReviewCount = 143, Stock = 35, Brand = "DeskPro",
                Description = "Monitor-mounted LED light bar with adjustable color temperature." },
        };
        await context.Products.InsertManyAsync(products);

        // Users (password: "Password123!")
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
        var users = new List<User>
        {
            new() { Email = "admin@techstore.com", PasswordHash = passwordHash, FirstName = "Admin", LastName = "User", Role = "Admin" },
            new() { Email = "john@example.com", PasswordHash = passwordHash, FirstName = "John", LastName = "Doe", Phone = "+84 912 345 678" },
            new() { Email = "jane@example.com", PasswordHash = passwordHash, FirstName = "Jane", LastName = "Smith", Phone = "+84 934 567 890" },
        };
        await context.Users.InsertManyAsync(users);

        var john = users[1];
        var jane = users[2];

        // Addresses
        await context.Addresses.InsertManyAsync(new[]
        {
            new Address { UserId = john.Id, Street = "123 Nguy?n Hu?", City = "Qu?n 1", State = "TP.HCM", ZipCode = "700000", Country = "Vi?t Nam", IsDefault = true },
            new Address { UserId = jane.Id, Street = "456 Tru?ng Sa", City = "Qu?n 3", State = "TP.HCM", ZipCode = "700000", Country = "Vi?t Nam", IsDefault = true }
        });

        // Orders (with embedded items and status history)
        var order1 = new Order
        {
            UserId = john.Id, Status = "Delivered", Subtotal = 349.98m, Tax = 35.00m, ShippingCost = 10m, Total = 394.98m,
            ShippingName = "John Doe", ShippingAddress = "123 Nguy?n Hu?", ShippingCity = "Qu?n 1", ShippingState = "TP.HCM",
            ShippingZipCode = "700000", ShippingCountry = "Vi?t Nam", ShippingEmail = "john@example.com", ShippingPhone = "+84 912 345 678",
            ShippingMethod = "standard", TrackingNumber = "TRK123456789", Carrier = "FedEx",
            EstimatedDelivery = DateTime.UtcNow.AddDays(-2), CreatedAt = DateTime.UtcNow.AddDays(-10),
            Items = new List<OrderItem>
            {
                new() { ProductId = products[0].Id, ProductName = "Premium Wireless Headphones", ProductImage = products[0].ImageUrl, Quantity = 1, Price = 299.99m },
                new() { ProductId = products[2].Id, ProductName = "USB-C Fast Charger", ProductImage = products[2].ImageUrl, Quantity = 1, Price = 49.99m }
            },
            StatusHistory = new List<OrderStatusHistory>
            {
                new() { Status = "Ðon hàng dã nh?n", Location = "Qu?n Tân Bình, TP.HCM", Description = "Ðon hàng dã du?c ti?p nh?n và xác nh?n", CreatedAt = DateTime.UtcNow.AddDays(-10) },
                new() { Status = "Ðang x? lý", Location = "Qu?n Tân Bình, TP.HCM", Description = "Gói hàng dang du?c chu?n b? d? giao", CreatedAt = DateTime.UtcNow.AddDays(-9) },
                new() { Status = "Ðã g?i hàng", Location = "Distribution Center, Memphis, TN", Description = "Gói hàng dã du?c g?i di t? kho", CreatedAt = DateTime.UtcNow.AddDays(-8) },
                new() { Status = "Ðang v?n chuy?n", Location = "Distribution Center, Chicago, IL", Description = "Gói hàng dã d?n trung tâm phân lo?i", CreatedAt = DateTime.UtcNow.AddDays(-7) },
                new() { Status = "Ðã giao", Location = "New York, NY", Description = "Gói hàng dã du?c giao d?n ngu?i nh?n", CreatedAt = DateTime.UtcNow.AddDays(-5) }
            }
        };
        var order2 = new Order
        {
            UserId = john.Id, Status = "Shipped", Subtotal = 199.99m, Tax = 20.00m, ShippingCost = 20m, Total = 239.99m,
            ShippingName = "John Doe", ShippingAddress = "123 Nguy?n Hu?", ShippingCity = "Qu?n 1", ShippingState = "TP.HCM",
            ShippingZipCode = "700000", ShippingCountry = "Vi?t Nam", ShippingEmail = "john@example.com",
            ShippingMethod = "express", TrackingNumber = "TRK987654321", Carrier = "UPS",
            EstimatedDelivery = DateTime.UtcNow.AddDays(2), CreatedAt = DateTime.UtcNow.AddDays(-5),
            Items = new List<OrderItem>
            {
                new() { ProductId = products[1].Id, ProductName = "Smart Watch Pro", ProductImage = products[1].ImageUrl, Quantity = 1, Price = 199.99m }
            },
            StatusHistory = new List<OrderStatusHistory>
            {
                new() { Status = "Ðon hàng dã nh?n", Location = "Qu?n Tân Bình, TP.HCM", Description = "Ðon hàng dã du?c ti?p nh?n và xác nh?n", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new() { Status = "Ðang x? lý", Location = "Qu?n Tân Bình, TP.HCM", Description = "Gói hàng dang du?c chu?n b?", CreatedAt = DateTime.UtcNow.AddDays(-4) },
                new() { Status = "Ðã g?i hàng", Location = "Distribution Center, Memphis, TN", Description = "Gói hàng dã du?c g?i di", CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new() { Status = "Ðang v?n chuy?n", Location = "Hub, Philadelphia, PA", Description = "Gói hàng dang trên du?ng v?n chuy?n", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            }
        };
        var order3 = new Order
        {
            UserId = john.Id, Status = "Processing", Subtotal = 529.97m, Tax = 53.00m, ShippingCost = 10m, Total = 592.97m,
            ShippingName = "John Doe", ShippingAddress = "123 Nguy?n Hu?", ShippingCity = "Qu?n 1", ShippingState = "TP.HCM",
            ShippingZipCode = "700000", ShippingCountry = "Vi?t Nam", ShippingEmail = "john@example.com",
            ShippingMethod = "standard", CreatedAt = DateTime.UtcNow.AddDays(-2),
            Items = new List<OrderItem>
            {
                new() { ProductId = products[0].Id, ProductName = "Premium Wireless Headphones", ProductImage = products[0].ImageUrl, Quantity = 1, Price = 299.99m },
                new() { ProductId = products[7].Id, ProductName = "Wireless Mouse Ergonomic", ProductImage = products[7].ImageUrl, Quantity = 1, Price = 59.99m },
                new() { ProductId = products[5].Id, ProductName = "Mechanical Keyboard RGB", ProductImage = products[5].ImageUrl, Quantity = 1, Price = 149.99m }
            },
            StatusHistory = new List<OrderStatusHistory>
            {
                new() { Status = "Ðon hàng dã nh?n", Location = "Qu?n Tân Bình, TP.HCM", Description = "Ðon hàng dã du?c ti?p nh?n và xác nh?n", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new() { Status = "Ðang x? lý", Location = "Qu?n Tân Bình, TP.HCM", Description = "Gói hàng dang du?c chu?n b?", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            }
        };
        var order4 = new Order
        {
            UserId = jane.Id, Status = "Delivered", Subtotal = 179.99m, Tax = 18.00m, ShippingCost = 0m, Total = 197.99m,
            ShippingName = "Jane Smith", ShippingAddress = "456 Tru?ng Sa", ShippingCity = "Qu?n 3", ShippingState = "TP.HCM",
            ShippingZipCode = "700000", ShippingCountry = "Vi?t Nam", ShippingEmail = "jane@example.com",
            ShippingMethod = "standard", TrackingNumber = "TRK555666777", Carrier = "USPS",
            CreatedAt = DateTime.UtcNow.AddDays(-15),
            Items = new List<OrderItem>
            {
                new() { ProductId = products[9].Id, ProductName = "Noise Cancelling Earbuds", ProductImage = products[9].ImageUrl, Quantity = 1, Price = 179.99m }
            },
            StatusHistory = new List<OrderStatusHistory>()
        };

        await context.Orders.InsertManyAsync(new[] { order1, order2, order3, order4 });

        // Reviews
        await context.Reviews.InsertManyAsync(new[]
        {
            new Review { UserId = john.Id, ProductId = products[0].Id, Rating = 5, Title = "Best headphones ever!", Comment = "Amazing sound quality and the noise cancellation is incredible.", CreatedAt = DateTime.UtcNow.AddDays(-20) },
            new Review { UserId = jane.Id, ProductId = products[0].Id, Rating = 5, Title = "Worth every penny", Comment = "Super comfortable for long listening sessions. The ANC is top-notch.", CreatedAt = DateTime.UtcNow.AddDays(-15) },
            new Review { UserId = john.Id, ProductId = products[1].Id, Rating = 4, Title = "Great smartwatch", Comment = "Excellent fitness tracking. Wish battery lasted a bit longer.", CreatedAt = DateTime.UtcNow.AddDays(-12) },
            new Review { UserId = jane.Id, ProductId = products[2].Id, Rating = 5, Title = "Fast charging beast", Comment = "Charges my laptop and phone simultaneously.", CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new Review { UserId = john.Id, ProductId = products[4].Id, Rating = 4, Title = "Amazing sound for the size", Comment = "Took it to the beach, got wet, still works perfectly!", CreatedAt = DateTime.UtcNow.AddDays(-8) },
            new Review { UserId = jane.Id, ProductId = products[5].Id, Rating = 5, Title = "Typing perfection", Comment = "The Cherry MX switches feel amazing. RGB is gorgeous.", CreatedAt = DateTime.UtcNow.AddDays(-7) },
            new Review { UserId = john.Id, ProductId = products[9].Id, Rating = 5, Title = "Better than AirPods", Comment = "The ANC is just as good as the over-ear version.", CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new Review { UserId = jane.Id, ProductId = products[6].Id, Rating = 4, Title = "Crystal clear video", Comment = "Perfect for video calls. Auto-focus works great.", CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new Review { UserId = john.Id, ProductId = products[8].Id, Rating = 5, Title = "Saved my back", Comment = "Great ergonomic improvement. Sturdy and well-built.", CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new Review { UserId = jane.Id, ProductId = products[16].Id, Rating = 5, Title = "Charges everything", Comment = "Charged my laptop twice on a single charge.", CreatedAt = DateTime.UtcNow.AddDays(-1) }
        });

        // (DAU seeding removed)
    }
}
