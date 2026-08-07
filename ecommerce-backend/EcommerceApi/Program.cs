using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using EcommerceApi.Data;
using EcommerceApi.Middleware;
using EcommerceApi.Services;
using EcommerceApi.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Database - MongoDB
builder.Services.AddSingleton<MongoDbContext>();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<WishlistService>();
builder.Services.AddScoped<ReviewService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<RecommendationService>();
builder.Services.AddScoped<ChatbotService>();
builder.Services.AddScoped<PromoCodeService>();
builder.Services.AddScoped<SupportService>();
builder.Services.AddScoped<ProductQuestionService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<LiveChatService>();
builder.Services.AddScoped<VoucherService>();
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<MomoService>();
builder.Services.AddScoped<VnPayService>();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// CORS - allow React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? new[] { "http://localhost:3000", "http://localhost:5173", "https://tech-store-zfhl.vercel.app" };
            
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// SignalR
builder.Services.AddSignalR();

// Controllers + JSON options
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Create indexes and seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await db.CreateIndexesAsync();
    await SeedData.InitializeAsync(db);
}

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();
app.UseStaticFiles(); // Serve uploaded images from wwwroot/
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");

// Welcome page
app.MapGet("/", () => Results.Ok(new
{
    name = "E-Commerce API",
    version = "v1",
    database = "MongoDB",
    docs = "/swagger",
    endpoints = new[]
    {
        "GET  /api/v1/products",
        "GET  /api/v1/products/{id}",
        "GET  /api/v1/products/featured",
        "GET  /api/v1/products/search?q=",
        "GET  /api/v1/categories",
        "POST /api/v1/auth/register",
        "POST /api/v1/auth/login",
        "GET  /api/v1/cart",
        "POST /api/v1/cart/items",
        "GET  /api/v1/orders",
        "POST /api/v1/orders",
        "GET  /api/v1/wishlist",
        "GET  /api/v1/products/{id}/reviews",
        "POST /api/v1/chatbot/message",
        "GET  /api/v1/recommendations",
        "GET  /api/v1/recommendations/{productId}",
        "POST /api/v1/recommendations/viewed"
    }
}));

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    app.Run($"http://*:{port}");
}
else
{
    app.Run();
}
