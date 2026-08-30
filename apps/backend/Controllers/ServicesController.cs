using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/services")]
[Authorize]
public sealed class ServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetServices(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var services = await db.Services
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.Name)
            .ToListAsync();
        return Results.Ok(services);
    }

    [HttpPost]
    public async Task<IResult> CreateService(string tenantId, CreateServiceRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.BadRequest(new { error = "Service name is required." });

        var service = new ServiceItem
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Description = request.Description,
            Price = request.Price,
            DurationMinutes = request.DurationMinutes,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            IsDisabled = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/services/{service.Id}", service);
    }

    [HttpPut("{id}")]
    public async Task<IResult> UpdateService(string tenantId, string id, UpdateServiceRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var service = await db.Services.SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == id);
        if (service is null) return Results.NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.BadRequest(new { error = "Service name is required." });

        service.Name = request.Name.Trim();
        service.Description = request.Description;
        service.Price = request.Price;
        service.DurationMinutes = request.DurationMinutes;
        service.Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim();
        service.IsDisabled = request.IsDisabled;
        service.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(service);
    }

    [HttpPut("{id}/toggle")]
    public async Task<IResult> ToggleService(string tenantId, string id)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var service = await db.Services.SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == id);
        if (service is null) return Results.NotFound();

        service.IsDisabled = !service.IsDisabled;
        service.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(service);
    }

    [HttpDelete("{id}")]
    public async Task<IResult> DeleteService(string tenantId, string id)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var service = await db.Services.SingleOrDefaultAsync(s => s.TenantId == tenantId && s.Id == id);
        if (service is null) return Results.NotFound();

        db.Services.Remove(service);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateServiceRequest(string Name, string? Description, decimal? Price, int? DurationMinutes, string? Category);
public sealed record UpdateServiceRequest(string Name, string? Description, decimal? Price, int? DurationMinutes, string? Category, bool IsDisabled);
