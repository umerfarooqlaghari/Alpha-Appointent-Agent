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

    [HttpPost("register")]
    public async Task<IResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.CompanyName))
            return Results.BadRequest(new { error = "Company name, email, and password are required." });

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == normalizedEmail))
            return Results.Conflict(new { error = "An account with this email address already exists. Please sign in instead." });

        var baseTenant = System.Text.RegularExpressions.Regex.Replace(request.CompanyName.Trim().ToLowerInvariant(), @"[^a-z0-9]", "-").Trim('-');
        if (string.IsNullOrWhiteSpace(baseTenant)) baseTenant = "workspace";
        var tenantId = $"{baseTenant}-{Guid.NewGuid().ToString("N")[..6]}";

        var chosenPlan = string.IsNullOrWhiteSpace(request.SelectedPlan) ? "Starter" : request.SelectedPlan.Trim();
        var planLimit = chosenPlan.ToLowerInvariant() switch
        {
            "pro" => 1500,
            "premium" => 5000,
            "trial" => 30,
            _ => 500
        };

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            db.Tenants.Add(new Tenant
            {
                TenantId = tenantId,
                Name = request.CompanyName.Trim(),
                Status = "active",
                CreatedAt = DateTimeOffset.UtcNow
            });

            db.TenantConfigs.Add(new TenantConfig
            {
                TenantId = tenantId,
                AdapterType = "postgres",
                IndustryType = string.IsNullOrWhiteSpace(request.IndustryType) ? "general" : request.IndustryType.Trim(),
                Currency = "USD"
            });

            var user = new User
            {
                TenantId = tenantId,
                Name = string.IsNullOrWhiteSpace(request.FullName) ? request.CompanyName.Trim() : request.FullName.Trim(),
                Email = normalizedEmail,
                Phone = request.Phone?.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "tenant_admin",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Users.Add(user);

            var now = DateTimeOffset.UtcNow;
            db.TenantSubscriptions.Add(new TenantSubscription
            {
                Id = $"sub_{Guid.NewGuid().ToString("N")[..8]}",
                TenantId = tenantId,
                PlanName = chosenPlan,
                MonthlyMinutesLimit = planLimit,
                MinutesUsed = 0.0,
                CurrentPeriodStart = now,
                CurrentPeriodEnd = now.AddDays(30),
                IsActive = true
            });

            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            var session = await CreateSessionAsync(user);
            return Results.Ok(new
            {
                token = session.AccessToken,
                refreshToken = session.RefreshToken,
                user = new { user.Id, user.Name, user.Email, user.Role, tenantId = user.TenantId }
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Results.Problem($"Registration failed: {ex.Message}");
        }
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
public sealed record RegisterRequest(string CompanyName, string Email, string Password, string? FullName = null, string? Phone = null, string? SelectedPlan = null, string? IndustryType = null);
public sealed record RefreshRequest(string RefreshToken);
public sealed record AuthSession(string AccessToken, string RefreshToken);