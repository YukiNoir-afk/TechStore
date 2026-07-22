using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.PromoCodes;

namespace EcommerceApi.Services;

public class PromoCodeService
{
    private readonly MongoDbContext _db;

    public PromoCodeService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<PromoCode> CreatePromoCode(CreatePromoCodeRequest request)
    {
        if (await _db.PromoCodes.Find(p => p.Code == request.Code).AnyAsync())
            throw new InvalidOperationException("Promo code already exists");

        var promoCode = new PromoCode
        {
            Code = request.Code,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinOrderValue = request.MinOrderValue,
            ExpiryDate = request.ExpiryDate,
            UsageLimit = request.UsageLimit
        };

        await _db.PromoCodes.InsertOneAsync(promoCode);
        return promoCode;
    }

    public async Task<List<PromoCode>> GetAllPromoCodes()
    {
        return await _db.PromoCodes.Find(_ => true).ToListAsync();
    }

    public async Task<PromoCode> UpdatePromoCode(string id, UpdatePromoCodeRequest request)
    {
        var update = Builders<PromoCode>.Update
            .Set(p => p.Code, request.Code)
            .Set(p => p.DiscountType, request.DiscountType)
            .Set(p => p.DiscountValue, request.DiscountValue)
            .Set(p => p.MinOrderValue, request.MinOrderValue)
            .Set(p => p.ExpiryDate, request.ExpiryDate)
            .Set(p => p.UsageLimit, request.UsageLimit)
            .Set(p => p.IsActive, request.IsActive);

        var result = await _db.PromoCodes.FindOneAndUpdateAsync(
            p => p.Id == id, update,
            new FindOneAndUpdateOptions<PromoCode> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? throw new KeyNotFoundException("Promo code not found");
    }

    public async Task DeletePromoCode(string id)
    {
        var result = await _db.PromoCodes.DeleteOneAsync(p => p.Id == id);
        if (result.DeletedCount == 0)
            throw new KeyNotFoundException("Promo code not found");
    }

    public async Task<PromoCode> ValidatePromoCode(string code)
    {
        var promoCode = await _db.PromoCodes.Find(p => p.Code == code).FirstOrDefaultAsync();
        if (promoCode == null)
            throw new InvalidOperationException("Invalid promo code");
        if (!promoCode.IsActive)
            throw new InvalidOperationException("Promo code is no longer active");
        if (promoCode.ExpiryDate < DateTime.UtcNow)
            throw new InvalidOperationException("Promo code has expired");
        if (promoCode.UsageLimit > 0 && promoCode.UsedCount >= promoCode.UsageLimit)
            throw new InvalidOperationException("Promo code usage limit reached");

        return promoCode;
    }
}
