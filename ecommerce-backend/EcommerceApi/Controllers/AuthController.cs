using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Auth;
using EcommerceApi.DTOs.Users;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    public AuthController(AuthService auth) { _auth = auth; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try { return Ok(await _auth.Register(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try { return Ok(await _auth.Login(request)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { error = ex.Message }); }
    }

    [Authorize, HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _auth.GetProfile(userId));
    }

    [Authorize, HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _auth.UpdateProfile(userId, request));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _auth.RequestPasswordReset(request.Email);
        return Ok(new { message = "If the email exists, a password reset token has been generated." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try 
        { 
            await _auth.ResetPassword(request.Token, request.NewPassword); 
            return Ok(new { message = "Password reset successfully" }); 
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }
}

