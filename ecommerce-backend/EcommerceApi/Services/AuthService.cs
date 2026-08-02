using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MongoDB.Driver;
using Microsoft.IdentityModel.Tokens;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Auth;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class AuthService
{
    private readonly MongoDbContext _db;
    private readonly IConfiguration _config;
    private readonly EmailService _emailService;

    public AuthService(MongoDbContext db, IConfiguration config, EmailService emailService) { _db = db; _config = config; _emailService = emailService; }

    public async Task<LoginResponse> Register(RegisterRequest request)
    {
        if (await _db.Users.Find(u => u.Email == request.Email).AnyAsync())
            throw new InvalidOperationException("Email này đã được đăng ký");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName
        };
        await _db.Users.InsertOneAsync(user);

        // Send Welcome Email
        _ = Task.Run(async () => 
        {
            try { await _emailService.SendWelcomeEmailAsync(user); } 
            catch (Exception ex) { Console.WriteLine($"Email error: {ex.Message}"); }
        });

        return new LoginResponse { Token = GenerateToken(user), User = MapUser(user) };
    }

    public async Task<LoginResponse> Login(LoginRequest request)
    {
        var user = await _db.Users.Find(u => u.Email == request.Email).FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác");
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác");
        if (user.IsLocked)
            throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        return new LoginResponse { Token = GenerateToken(user), User = MapUser(user) };
    }

    public async Task<UserDto> GetProfile(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");
        return MapUser(user);
    }

    public async Task<UserDto> UpdateProfile(string userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");

        var update = Builders<User>.Update;
        var updates = new List<UpdateDefinition<User>>();

        if (request.FirstName != null) updates.Add(update.Set(u => u.FirstName, request.FirstName));
        if (request.LastName != null) updates.Add(update.Set(u => u.LastName, request.LastName));
        if (request.Phone != null) updates.Add(update.Set(u => u.Phone, request.Phone));
        if (request.AvatarUrl != null) updates.Add(update.Set(u => u.AvatarUrl, request.AvatarUrl));

        if (updates.Any())
        {
            await _db.Users.UpdateOneAsync(u => u.Id == userId, update.Combine(updates));
            user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }

        return MapUser(user!);
    }

    public async Task<string?> RequestPasswordReset(string email)
    {
        var user = await _db.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (user == null) return null;

        var token = Guid.NewGuid().ToString("N");
        var update = Builders<User>.Update
            .Set(u => u.ResetPasswordToken, token)
            .Set(u => u.ResetTokenExpiry, DateTime.UtcNow.AddHours(1));

        await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);

        if (_emailService.IsConfigured())
        {
            await _emailService.SendPasswordResetAsync(user, token);
            return null;
        }
        
        // Email not configured – return token directly for dev/demo
        return token;
    }

    public async Task ResetPassword(string token, string newPassword)
    {
        var user = await _db.Users.Find(u => u.ResetPasswordToken == token).FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Mã xác thực không hợp lệ hoặc đã hết hạn");

        if (user.ResetTokenExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("Mã xác thực không hợp lệ hoặc đã hết hạn");

        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        var update = Builders<User>.Update
            .Set(u => u.PasswordHash, hash)
            .Set(u => u.ResetPasswordToken, null)
            .Set(u => u.ResetTokenExpiry, null);

        await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
    }

    public async Task ChangePassword(string userId, string currentPassword, string newPassword)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không chính xác");

        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, hash);
        await _db.Users.UpdateOneAsync(u => u.Id == userId, update);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.GivenName, user.FirstName)
            },
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapUser(User u) => new() { Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName, Phone = u.Phone, AvatarUrl = u.AvatarUrl, Role = u.Role, Points = u.Points, LoyaltyTier = u.LoyaltyTier, CreatedAt = u.CreatedAt };
}
