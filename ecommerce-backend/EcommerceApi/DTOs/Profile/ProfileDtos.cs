using EcommerceApi.DTOs.Auth;

namespace EcommerceApi.DTOs.Profile;

public class ProfileResponse
{
    public UserDto User { get; set; } = null!;
    public List<AddressDto> Addresses { get; set; } = new();
    public OrderStats Stats { get; set; } = new();
}

public class OrderStats
{
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public int PointsToNextTier { get; set; }
    public string NextTier { get; set; } = string.Empty;
}

public class AddressDto
{
    public string Id { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class AddressRequest
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
