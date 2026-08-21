using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IResult> Login(LoginRequest request)
    {
        var user = await db.Users.SingleOrDefaultAsync(item => item.Email == request.Email.Trim().ToLowerInvariant());
        if (user is null || !user.IsActive || string.IsNullOrWhiteSpace(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return Results.Unauthorized();
        var session = await CreateSessionAsync(user);
        return Results.Ok(new { token = session.AccessToken, refreshToken = session.RefreshToken, user = new { user.Id, user.Name, user.Email, user.Role, tenantId = user.TenantId } });
    }

    [HttpPost("refresh")]
    public async Task<IResult> Refresh(RefreshRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken)) return Results.Unauthorized();
        var now = DateTimeOffset.UtcNow;
        var storedToken = await db.RefreshTokens.SingleOrDefaultAsync(item => item.TokenHash == HashToken(request.RefreshToken));
        if (storedToken is null || storedToken.RevokedAt is not null || storedToken.ExpiresAt <= now) return Results.Unauthorized();
        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == storedToken.UserId);
        if (user is null || !user.IsActive) return Results.Unauthorized();
        storedToken.RevokedAt = now;
        var session = await CreateSessionAsync(user);
        return Results.Ok(new { token = session.AccessToken, refreshToken = session.RefreshToken });
    }

    [HttpPost("logout")]
    public async Task<IResult> Logout(RefreshRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken)) return Results.NoContent();
        var storedToken = await db.RefreshTokens.SingleOrDefaultAsync(item => item.TokenHash == HashToken(request.RefreshToken));
        if (storedToken is not null && storedToken.RevokedAt is null) { storedToken.RevokedAt = DateTimeOffset.UtcNow; await db.SaveChangesAsync(); }
        return Results.NoContent();
    }

    private async Task<AuthSession> CreateSessionAsync(User user)
    {
        var now = DateTimeOffset.UtcNow;
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Email, user.Email), new Claim(ClaimTypes.Role, user.Role), new Claim("tenant_id", user.TenantId ?? "") };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JWT_SECRET"]!));
        var token = new JwtSecurityToken("alpha-appointment-api", "alpha-appointment-frontends", claims, expires: now.UtcDateTime.AddDays(1), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        db.RefreshTokens.Add(new RefreshToken { TokenHash = HashToken(refreshToken), UserId = user.Id, CreatedAt = now, ExpiresAt = now.AddDays(30) });
        await db.SaveChangesAsync();
        return new AuthSession(new JwtSecurityTokenHandler().WriteToken(token), refreshToken);
    }

    private static string HashToken(string refreshToken) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
}

public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record AuthSession(string AccessToken, string RefreshToken);