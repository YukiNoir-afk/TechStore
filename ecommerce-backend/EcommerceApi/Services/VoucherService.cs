using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Vouchers;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class VoucherService
{
    private readonly MongoDbContext _db;

    public VoucherService(MongoDbContext db)
    {
        _db = db;
    }

    // ── Customer: Get My Vouchers ─────────────────────────────────────────
    public async Task<List<VoucherDto>> GetMyVouchers(string userId)
    {
        var vouchers = await _db.Vouchers.Find(v => v.UserId == userId)
            .Sort(Builders<Voucher>.Sort.Descending(v => v.CreatedAt))
            .ToListAsync();

        return vouchers.Select(MapToDto).ToList();
    }

    // ── Customer: Validate Voucher ────────────────────────────────────────
    public async Task<VoucherValidationResult> ValidateVoucher(string userId, string code)
    {
        var voucher = await _db.Vouchers.Find(v => v.Code == code && v.UserId == userId).FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Voucher không hợp lệ hoặc không thuộc về bạn");

        ValidateVoucherState(voucher, userId);

        return new VoucherValidationResult
        {
            Code = voucher.Code,
            DiscountType = voucher.DiscountType,
            DiscountValue = voucher.DiscountValue,
            MinOrderValue = voucher.MinOrderValue
        };
    }

    // ── Customer: Use Voucher (called during checkout) ─────────────────────
    public async Task<Voucher> UseVoucher(string userId, string code)
    {
        var voucher = await _db.Vouchers.Find(v => v.Code == code && v.UserId == userId).FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Voucher không hợp lệ hoặc không thuộc về bạn");

        ValidateVoucherState(voucher, userId);

        await _db.Vouchers.UpdateOneAsync(
            v => v.Id == voucher.Id,
            Builders<Voucher>.Update
                .Set(v => v.IsUsed, true)
                .Set(v => v.UsedAt, DateTime.UtcNow));

        return voucher;
    }

    // ── Admin: Give Voucher to User ───────────────────────────────────────
    public async Task<VoucherDto> GiveVoucher(AdminGiveVoucherRequest request)
    {
        var user = await _db.Users.Find(u => u.Id == request.UserId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        var code = request.Code ?? GenerateVoucherCode();

        // Check code uniqueness
        if (await _db.Vouchers.Find(v => v.Code == code).AnyAsync())
            throw new InvalidOperationException($"Mã voucher '{code}' đã tồn tại");

        var voucher = new Voucher
        {
            UserId = request.UserId,
            Code = code,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinOrderValue = request.MinOrderValue,
            TierRequired = request.TierRequired,
            ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddDays(30),
            Source = "Admin"
        };

        await _db.Vouchers.InsertOneAsync(voucher);
        return MapToDto(voucher);
    }

    // ── Admin: Give Voucher to All Users in a Tier ────────────────────────
    public async Task<int> GiveVoucherToTier(AdminGiveVoucherToTierRequest request)
    {
        var validTiers = new[] { "Bronze", "Silver", "Gold", "Platinum" };
        if (!validTiers.Contains(request.Tier))
            throw new InvalidOperationException("Bậc không hợp lệ. Chọn: Bronze, Silver, Gold, Platinum");

        var users = await _db.Users.Find(u => u.LoyaltyTier == request.Tier && u.Role != "Admin").ToListAsync();
        if (!users.Any())
            throw new KeyNotFoundException($"Không có khách hàng nào ở bậc {request.Tier}");

        var expiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddDays(30);
        var vouchers = new List<Voucher>();

        foreach (var user in users)
        {
            vouchers.Add(new Voucher
            {
                UserId = user.Id,
                Code = request.Code != null ? $"{request.Code}-{user.Id[^6..]}" : GenerateVoucherCode(),
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                MinOrderValue = request.MinOrderValue,
                TierRequired = request.Tier,
                ExpiryDate = expiryDate,
                Source = "Admin"
            });
        }

        await _db.Vouchers.InsertManyAsync(vouchers);
        return vouchers.Count;
    }

    // ── System: Auto-grant Voucher on Tier Up ─────────────────────────────
    public async Task AutoGrantTierUpVoucher(string userId, string newTier)
    {
        var (discountValue, minOrderValue, daysValid) = newTier switch
        {
            "Silver" => (5m, (decimal?)200000, 30),
            "Gold" => (10m, (decimal?)500000, 30),
            "Platinum" => (15m, (decimal?)null, 60),
            _ => (0m, (decimal?)null, 0)
        };

        if (discountValue <= 0) return;

        var voucher = new Voucher
        {
            UserId = userId,
            Code = GenerateVoucherCode(),
            DiscountType = "Percentage",
            DiscountValue = discountValue,
            MinOrderValue = minOrderValue,
            TierRequired = newTier,
            ExpiryDate = DateTime.UtcNow.AddDays(daysValid),
            Source = "System"
        };

        await _db.Vouchers.InsertOneAsync(voucher);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private void ValidateVoucherState(Voucher voucher, string userId)
    {
        if (voucher.IsUsed)
            throw new InvalidOperationException("Voucher đã được sử dụng");

        if (voucher.ExpiryDate < DateTime.UtcNow)
            throw new InvalidOperationException("Voucher đã hết hạn");
    }

    private static string GenerateVoucherCode()
    {
        return $"VC-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
    }

    private static int GetTierLevel(string tier) => tier switch
    {
        "Bronze" => 0,
        "Silver" => 1,
        "Gold" => 2,
        "Platinum" => 3,
        _ => 0
    };

    private static VoucherDto MapToDto(Voucher v) => new()
    {
        Id = v.Id,
        Code = v.Code,
        DiscountType = v.DiscountType,
        DiscountValue = v.DiscountValue,
        MinOrderValue = v.MinOrderValue,
        TierRequired = v.TierRequired,
        ExpiryDate = v.ExpiryDate,
        IsUsed = v.IsUsed,
        UsedAt = v.UsedAt,
        Source = v.Source,
        CreatedAt = v.CreatedAt
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Voucher Template / Catalog ───────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════

    // ── Customer: Get Voucher Catalog ─────────────────────────────────────
    public async Task<List<VoucherCatalogItemDto>> GetVoucherCatalog(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        var userTierLevel = GetTierLevel(user.LoyaltyTier);

        // Get all active, non-expired templates
        var templates = await _db.VoucherTemplates
            .Find(vt => vt.IsActive && vt.ExpiryDate > DateTime.UtcNow)
            .Sort(Builders<VoucherTemplate>.Sort.Ascending(vt => vt.TierRequired).Descending(vt => vt.CreatedAt))
            .ToListAsync();

        // Get user's existing vouchers to check which templates already claimed
        var userVouchers = await _db.Vouchers.Find(v => v.UserId == userId).ToListAsync();
        var claimedTemplateIds = userVouchers
            .Where(v => v.TemplateId != null)
            .Select(v => v.TemplateId!)
            .ToHashSet();

        return templates.Select(t =>
        {
            var templateTierLevel = GetTierLevel(t.TierRequired);
            var isLocked = userTierLevel < templateTierLevel;
            var alreadyClaimed = claimedTemplateIds.Contains(t.Id);
            var isSoldOut = t.MaxClaims > 0 && t.ClaimedCount >= t.MaxClaims;

            return new VoucherCatalogItemDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                DiscountType = t.DiscountType,
                DiscountValue = t.DiscountValue,
                MinOrderValue = t.MinOrderValue,
                TierRequired = t.TierRequired,
                ExpiryDate = t.ExpiryDate,
                MaxClaims = t.MaxClaims,
                ClaimedCount = t.ClaimedCount,
                IsLocked = isLocked,
                IsClaimable = !isLocked && !alreadyClaimed && !isSoldOut,
                AlreadyClaimed = alreadyClaimed,
                CreatedAt = t.CreatedAt
            };
        }).ToList();
    }

    // ── Customer: Claim Voucher ───────────────────────────────────────────
    public async Task<ClaimVoucherResponse> ClaimVoucher(string userId, string templateId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        var template = await _db.VoucherTemplates.Find(vt => vt.Id == templateId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Voucher không tồn tại");

        // Check active
        if (!template.IsActive)
            throw new InvalidOperationException("Voucher này đã ngừng phát hành");

        // Check expiry
        if (template.ExpiryDate < DateTime.UtcNow)
            throw new InvalidOperationException("Voucher này đã hết hạn");

        // Check tier
        if (GetTierLevel(user.LoyaltyTier) < GetTierLevel(template.TierRequired))
            throw new InvalidOperationException($"Bạn cần đạt hạng {template.TierRequired} để nhận voucher này");

        // Check already claimed
        var alreadyClaimed = await _db.Vouchers.Find(v => v.UserId == userId && v.TemplateId == templateId).AnyAsync();
        if (alreadyClaimed)
            throw new InvalidOperationException("Bạn đã nhận voucher này rồi");

        // Check max claims
        if (template.MaxClaims > 0 && template.ClaimedCount >= template.MaxClaims)
            throw new InvalidOperationException("Voucher này đã hết lượt nhận");

        // Generate unique code
        var code = string.IsNullOrEmpty(template.CodePrefix)
            ? GenerateVoucherCode()
            : $"{template.CodePrefix}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        // Ensure code uniqueness
        while (await _db.Vouchers.Find(v => v.Code == code).AnyAsync())
        {
            code = string.IsNullOrEmpty(template.CodePrefix)
                ? GenerateVoucherCode()
                : $"{template.CodePrefix}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }

        // Create personal voucher
        var voucher = new Voucher
        {
            UserId = userId,
            Code = code,
            DiscountType = template.DiscountType,
            DiscountValue = template.DiscountValue,
            MinOrderValue = template.MinOrderValue,
            TierRequired = template.TierRequired,
            ExpiryDate = template.ExpiryDate,
            Source = "Catalog",
            TemplateId = template.Id
        };

        await _db.Vouchers.InsertOneAsync(voucher);

        // Increment claimed count
        await _db.VoucherTemplates.UpdateOneAsync(
            vt => vt.Id == templateId,
            Builders<VoucherTemplate>.Update.Inc(vt => vt.ClaimedCount, 1));

        return new ClaimVoucherResponse
        {
            Message = "Nhận voucher thành công! Bạn có thể sử dụng khi thanh toán.",
            Voucher = MapToDto(voucher)
        };
    }

    // ── Admin: Create Voucher Template ────────────────────────────────────
    public async Task<VoucherTemplateDto> CreateVoucherTemplate(CreateVoucherTemplateRequest request)
    {
        var validTiers = new[] { "Bronze", "Silver", "Gold", "Platinum" };
        if (!validTiers.Contains(request.TierRequired))
            throw new InvalidOperationException("Bậc không hợp lệ. Chọn: Bronze, Silver, Gold, Platinum");

        var template = new VoucherTemplate
        {
            Title = request.Title,
            Description = request.Description,
            CodePrefix = request.CodePrefix ?? "",
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinOrderValue = request.MinOrderValue,
            TierRequired = request.TierRequired,
            ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddDays(30),
            MaxClaims = request.MaxClaims
        };

        await _db.VoucherTemplates.InsertOneAsync(template);
        return MapTemplateToDto(template);
    }

    // ── Admin: Get All Templates ──────────────────────────────────────────
    public async Task<List<VoucherTemplateDto>> GetAllTemplates()
    {
        var templates = await _db.VoucherTemplates
            .Find(_ => true)
            .Sort(Builders<VoucherTemplate>.Sort.Descending(vt => vt.CreatedAt))
            .ToListAsync();

        return templates.Select(MapTemplateToDto).ToList();
    }

    // ── Admin: Toggle Template Active ─────────────────────────────────────
    public async Task ToggleTemplate(string templateId)
    {
        var template = await _db.VoucherTemplates.Find(vt => vt.Id == templateId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Template không tồn tại");

        await _db.VoucherTemplates.UpdateOneAsync(
            vt => vt.Id == templateId,
            Builders<VoucherTemplate>.Update.Set(vt => vt.IsActive, !template.IsActive));
    }

    private static VoucherTemplateDto MapTemplateToDto(VoucherTemplate t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        CodePrefix = t.CodePrefix,
        DiscountType = t.DiscountType,
        DiscountValue = t.DiscountValue,
        MinOrderValue = t.MinOrderValue,
        TierRequired = t.TierRequired,
        ExpiryDate = t.ExpiryDate,
        MaxClaims = t.MaxClaims,
        ClaimedCount = t.ClaimedCount,
        IsActive = t.IsActive,
        CreatedAt = t.CreatedAt
    };
}

