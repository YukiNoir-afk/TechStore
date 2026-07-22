using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Auth;
using EcommerceApi.DTOs.Profile;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/profile"), Authorize]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _profile;
    private readonly AuthService _auth;

    public ProfileController(ProfileService profile, AuthService auth)
    {
        _profile = profile;
        _auth = auth;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        return Ok(await _profile.GetFullProfile(UserId));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var updated = await _auth.UpdateProfile(UserId, request);
        return Ok(updated);
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            await _auth.ChangePassword(UserId, request.CurrentPassword, request.NewPassword);
            return Ok(new { message = "Đổi mật khẩu thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        return Ok(await _profile.GetAddresses(UserId));
    }

    [HttpPost("addresses")]
    public async Task<IActionResult> AddAddress([FromBody] AddressRequest request)
    {
        var address = await _profile.AddAddress(UserId, request);
        return Created($"api/v1/profile/addresses/{address.Id}", address);
    }

    [HttpPut("addresses/{id}")]
    public async Task<IActionResult> UpdateAddress(string id, [FromBody] AddressRequest request)
    {
        try
        {
            var address = await _profile.UpdateAddress(UserId, id, request);
            return Ok(address);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("addresses/{id}")]
    public async Task<IActionResult> DeleteAddress(string id)
    {
        try
        {
            await _profile.DeleteAddress(UserId, id);
            return Ok(new { message = "Đã xóa địa chỉ" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("addresses/{id}/default")]
    public async Task<IActionResult> SetDefaultAddress(string id)
    {
        try
        {
            await _profile.SetDefaultAddress(UserId, id);
            return Ok(new { message = "Đã đặt địa chỉ mặc định" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
