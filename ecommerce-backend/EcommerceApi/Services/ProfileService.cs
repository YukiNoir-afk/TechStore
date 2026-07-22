using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Auth;
using EcommerceApi.DTOs.Profile;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class ProfileService
{
    private readonly MongoDbContext _db;

    public ProfileService(MongoDbContext db) { _db = db; }

    public async Task<ProfileResponse> GetFullProfile(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("User not found");

        var addresses = await _db.Addresses.Find(a => a.UserId == userId).ToListAsync();
        var orders = await _db.Orders.Find(o => o.UserId == userId).ToListAsync();

        var totalSpent = orders.Where(o => o.Status != "Cancelled").Sum(o => o.Total);
        var totalOrders = orders.Count;

        // Calculate points to next tier
        var (pointsToNext, nextTier) = GetNextTierInfo(user.Points, user.LoyaltyTier);

        return new ProfileResponse
        {
            User = MapUser(user),
            Addresses = addresses.Select(MapAddress).ToList(),
            Stats = new OrderStats
            {
                TotalOrders = totalOrders,
                TotalSpent = totalSpent,
                PointsToNextTier = pointsToNext,
                NextTier = nextTier
            }
        };
    }

    public async Task<List<AddressDto>> GetAddresses(string userId)
    {
        var addresses = await _db.Addresses.Find(a => a.UserId == userId).ToListAsync();
        return addresses.Select(MapAddress).ToList();
    }

    public async Task<AddressDto> AddAddress(string userId, AddressRequest request)
    {
        // If this is the first address or marked as default, ensure only one default
        var existingCount = await _db.Addresses.CountDocumentsAsync(a => a.UserId == userId);
        var isDefault = request.IsDefault || existingCount == 0;

        if (isDefault)
        {
            // Unset any existing default
            await _db.Addresses.UpdateManyAsync(
                a => a.UserId == userId && a.IsDefault,
                Builders<Address>.Update.Set(a => a.IsDefault, false));
        }

        var address = new Address
        {
            UserId = userId,
            Street = request.Street,
            City = request.City,
            State = request.State,
            ZipCode = request.ZipCode,
            Country = request.Country,
            IsDefault = isDefault
        };

        await _db.Addresses.InsertOneAsync(address);
        return MapAddress(address);
    }

    public async Task<AddressDto> UpdateAddress(string userId, string addressId, AddressRequest request)
    {
        var address = await _db.Addresses.Find(a => a.Id == addressId && a.UserId == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Address not found");

        if (request.IsDefault)
        {
            await _db.Addresses.UpdateManyAsync(
                a => a.UserId == userId && a.IsDefault,
                Builders<Address>.Update.Set(a => a.IsDefault, false));
        }

        var update = Builders<Address>.Update
            .Set(a => a.Street, request.Street)
            .Set(a => a.City, request.City)
            .Set(a => a.State, request.State)
            .Set(a => a.ZipCode, request.ZipCode)
            .Set(a => a.Country, request.Country)
            .Set(a => a.IsDefault, request.IsDefault);

        await _db.Addresses.UpdateOneAsync(a => a.Id == addressId, update);

        var updated = await _db.Addresses.Find(a => a.Id == addressId).FirstOrDefaultAsync();
        return MapAddress(updated!);
    }

    public async Task DeleteAddress(string userId, string addressId)
    {
        var result = await _db.Addresses.DeleteOneAsync(a => a.Id == addressId && a.UserId == userId);
        if (result.DeletedCount == 0)
            throw new KeyNotFoundException("Address not found");

        // If deleted address was default, set the first remaining as default
        var remaining = await _db.Addresses.Find(a => a.UserId == userId).FirstOrDefaultAsync();
        if (remaining != null)
        {
            var hasDefault = await _db.Addresses.Find(a => a.UserId == userId && a.IsDefault).AnyAsync();
            if (!hasDefault)
            {
                await _db.Addresses.UpdateOneAsync(
                    a => a.Id == remaining.Id,
                    Builders<Address>.Update.Set(a => a.IsDefault, true));
            }
        }
    }

    public async Task SetDefaultAddress(string userId, string addressId)
    {
        var address = await _db.Addresses.Find(a => a.Id == addressId && a.UserId == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Address not found");

        // Unset all defaults
        await _db.Addresses.UpdateManyAsync(
            a => a.UserId == userId && a.IsDefault,
            Builders<Address>.Update.Set(a => a.IsDefault, false));

        // Set new default
        await _db.Addresses.UpdateOneAsync(
            a => a.Id == addressId,
            Builders<Address>.Update.Set(a => a.IsDefault, true));
    }

    private static (int pointsToNext, string nextTier) GetNextTierInfo(int points, string currentTier)
    {
        return currentTier switch
        {
            "Bronze" => (500 - points, "Silver"),
            "Silver" => (1500 - points, "Gold"),
            "Gold" => (3000 - points, "Platinum"),
            "Platinum" => (0, "Platinum"),
            _ => (500 - points, "Silver")
        };
    }

    private static UserDto MapUser(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName,
        Phone = u.Phone,
        AvatarUrl = u.AvatarUrl,
        Role = u.Role,
        Points = u.Points,
        LoyaltyTier = u.LoyaltyTier,
        CreatedAt = u.CreatedAt
    };

    private static AddressDto MapAddress(Address a) => new()
    {
        Id = a.Id,
        Street = a.Street,
        City = a.City,
        State = a.State,
        ZipCode = a.ZipCode,
        Country = a.Country,
        IsDefault = a.IsDefault
    };
}
