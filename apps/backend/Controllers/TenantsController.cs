using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Alpha.Appointment.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppointmentEntity = Alpha.Appointment.Api.Models.Appointment;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api")]
public sealed class TenantsController(AppDbContext db, AvailabilityScheduleService schedules) : ControllerBase
{
    [Authorize(Roles = "superadmin"), HttpGet("admin/tenants")]
    public async Task<IResult> ListTenants() => Results.Ok(await db.Tenants.OrderByDescending(item => item.CreatedAt).ToListAsync());

    [Authorize(Roles = "superadmin"), HttpPost("admin/tenants")]
    public async Task<IResult> CreateTenant(CreateTenantRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId) || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.AdminEmail) || string.IsNullOrWhiteSpace(request.AdminPassword)) return Results.BadRequest(new { error = "Tenant and admin credentials are required." });
        if (!new[] { "postgres", "shopify", "pos-http" }.Contains(request.AdapterType)) return Results.BadRequest(new { error = "Invalid adapter type." });
        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            db.Tenants.Add(new Tenant { TenantId = request.TenantId, Name = request.Name, Status = "active", CreatedAt = DateTimeOffset.UtcNow });
            db.TenantConfigs.Add(new TenantConfig { TenantId = request.TenantId, AdapterType = request.AdapterType, ApiBaseUrl = request.ApiBaseUrl, AuthHeaderName = request.AuthHeaderName, AuthToken = request.AuthToken });
            db.Users.Add(new User { TenantId = request.TenantId, Name = request.AdminName ?? request.Name, Email = request.AdminEmail.ToLowerInvariant(), Phone = request.AdminPhone, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword), Role = "tenant_admin", IsActive = true, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync(); await transaction.CommitAsync(); return Results.Created($"/api/tenants/{request.TenantId}", new { tenantId = request.TenantId });
        }
        catch (DbUpdateException) { await transaction.RollbackAsync(); return Results.Conflict(new { error = "Tenant ID or admin email already exists." }); }
    }

    [AllowAnonymous, HttpGet("tenants/{tenantId}/public")]
    public async Task<IResult> PublicTenant(string tenantId) => await db.Tenants.Where(item => item.TenantId == tenantId && item.Status == "active").Select(item => new { tenantId = item.TenantId, name = item.Name }).SingleOrDefaultAsync() is { } tenant ? Results.Ok(tenant) : Results.NotFound();

    [Authorize, HttpGet("tenants/{tenantId}/dashboard")]
    public async Task<IResult> Dashboard(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var slots = db.AvailabilitySlots.Where(item => item.TenantId == tenantId);
        return Results.Ok(new { total = await slots.CountAsync(), booked = await slots.CountAsync(item => item.IsBooked), free = await slots.CountAsync(item => !item.IsBooked) });
    }

    [Authorize, HttpGet("tenants/{tenantId}/slots")]
    public async Task<IResult> Slots(string tenantId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (page < 1 || pageSize is < 1 or > 100) return Results.BadRequest(new { error = "Page must be positive and page size must be between 1 and 100." });
        var slots = db.AvailabilitySlots.Where(item => item.TenantId == tenantId && item.SlotStart >= DateTimeOffset.UtcNow).OrderBy(item => item.SlotStart);
        var total = await slots.CountAsync();
        var items = await slots.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Results.Ok(new SlotPageResponse(items, total, page, pageSize));
    }

    [Authorize, HttpPost("tenants/{tenantId}/slots")]
    public IResult CreateSlot(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        return Results.BadRequest(new { error = "Slots are generated automatically from working hours and holidays. Update availability settings instead." });
    }

    [Authorize, HttpDelete("tenants/{tenantId}/slots/{slotId}")]
    public async Task<IResult> DeleteSlot(string tenantId, string slotId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var slot = await db.AvailabilitySlots.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.SlotId == slotId);
        if (slot is null) return Results.NotFound();
        if (slot.IsBooked || slot.SlotStart < DateTimeOffset.UtcNow) return Results.Conflict(new { error = "Only future unbooked slots can be deleted." });
        db.TenantSlotExclusions.Add(new TenantSlotExclusion { TenantId = tenantId, SlotStart = slot.SlotStart });
        db.AvailabilitySlots.Remove(slot);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    [Authorize, HttpGet("tenants/{tenantId}/availability")]
    public async Task<IResult> Availability(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var settings = await db.TenantAvailabilitySettings.SingleOrDefaultAsync(item => item.TenantId == tenantId) ?? new TenantAvailabilitySettings { TenantId = tenantId };
        var workingHours = await db.TenantWorkingHours.Where(item => item.TenantId == tenantId).OrderBy(item => item.DayOfWeek).ToListAsync();
        var holidays = await db.TenantHolidays.Where(item => item.TenantId == tenantId).OrderBy(item => item.HolidayDate).ToListAsync();
        return Results.Ok(new AvailabilityResponse(settings.TimeZone, settings.SlotDurationMinutes, workingHours.Select(item => new WorkingHoursResponse(item.DayOfWeek, item.StartTime, item.EndTime)).ToList(), holidays.Select(item => new HolidayResponse(item.HolidayDate, item.Name)).ToList()));
    }

    [Authorize, HttpPut("tenants/{tenantId}/availability")]
    public async Task<IResult> UpdateAvailability(string tenantId, AvailabilityRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var workingHours = request.WorkingHours ?? [];
        var holidays = request.Holidays ?? [];
        if (request.SlotDurationMinutes is < 5 or > 120 || request.SlotDurationMinutes % 5 != 0 || string.IsNullOrWhiteSpace(request.TimeZone)) return Results.BadRequest(new { error = "Use a time zone and a slot duration from 5 to 120 minutes in five-minute intervals." });
        try { _ = TimeZoneInfo.FindSystemTimeZoneById(request.TimeZone); }
        catch (TimeZoneNotFoundException) { return Results.BadRequest(new { error = "Use a valid IANA time zone, such as America/New_York." }); }
        if (workingHours.Any(item => item.DayOfWeek is < 0 or > 6 || item.StartTime >= item.EndTime) || workingHours.Select(item => item.DayOfWeek).Distinct().Count() != workingHours.Count || holidays.GroupBy(item => item.HolidayDate).Any(group => group.Count() > 1)) return Results.BadRequest(new { error = "Working hours or holiday dates are invalid." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        var settings = await db.TenantAvailabilitySettings.SingleOrDefaultAsync(item => item.TenantId == tenantId);
        if (settings is null) { settings = new TenantAvailabilitySettings { TenantId = tenantId }; db.TenantAvailabilitySettings.Add(settings); }
        settings.TimeZone = request.TimeZone; settings.SlotDurationMinutes = request.SlotDurationMinutes;
        await db.TenantWorkingHours.Where(item => item.TenantId == tenantId).ExecuteDeleteAsync();
        await db.TenantHolidays.Where(item => item.TenantId == tenantId).ExecuteDeleteAsync();
        db.TenantWorkingHours.AddRange(workingHours.Select(item => new TenantWorkingHours { TenantId = tenantId, DayOfWeek = item.DayOfWeek, StartTime = item.StartTime, EndTime = item.EndTime }));
        db.TenantHolidays.AddRange(holidays.Select(item => new TenantHoliday { HolidayId = Guid.NewGuid().ToString(), TenantId = tenantId, HolidayDate = item.HolidayDate, Name = string.IsNullOrWhiteSpace(item.Name) ? null : item.Name }));
        await db.SaveChangesAsync(); await transaction.CommitAsync();
        await schedules.SynchronizeAsync(tenantId);
        return Results.NoContent();
    }

    [Authorize, HttpGet("tenants/{tenantId}/config")]
    public async Task<IResult> Config(string tenantId) => CanAccess(tenantId) ? Results.Ok(await db.TenantConfigs.SingleOrDefaultAsync(item => item.TenantId == tenantId)) : Results.Forbid();

    [Authorize, HttpPut("tenants/{tenantId}/config")]
    public async Task<IResult> UpdateConfig(string tenantId, ConfigRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (!new[] { "postgres", "shopify", "pos-http" }.Contains(request.AdapterType)) return Results.BadRequest();
        var config = await db.TenantConfigs.SingleOrDefaultAsync(item => item.TenantId == tenantId);
        if (config is null) { config = new TenantConfig { TenantId = tenantId }; db.TenantConfigs.Add(config); }
        config.AdapterType = request.AdapterType; config.ApiBaseUrl = request.ApiBaseUrl; config.AuthHeaderName = request.AuthHeaderName; config.AuthToken = request.AuthToken; config.ProductsApiUrl = request.ProductsApiUrl; config.InventorySource = request.InventorySource ?? "database";
        config.PublishableKey = request.PublishableKey; config.AllowedDomains = request.AllowedDomains;
        await db.SaveChangesAsync(); return Results.NoContent();
    }

    [Authorize, HttpGet("tenants/{tenantId}/appointments")]
    public async Task<IResult> Appointments(string tenantId) => CanAccess(tenantId) ? Results.Ok(await AppointmentQuery(db.Appointments.Where(item => item.TenantId == tenantId)).ToListAsync()) : Results.Forbid();

    [Authorize, HttpPost("tenants/{tenantId}/appointments/{appointmentId}/cancel")]
    public async Task<IResult> Cancel(string tenantId, string appointmentId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid(); await using var transaction = await db.Database.BeginTransactionAsync();
        var appointment = await db.Appointments.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.AppointmentId == appointmentId); if (appointment is null) return Results.NotFound(); appointment.Status = "cancelled";
        await db.AvailabilitySlots.Where(item => item.TenantId == tenantId && item.AppointmentId == appointmentId).ExecuteUpdateAsync(setter => setter.SetProperty(item => item.IsBooked, false).SetProperty(item => item.AppointmentId, (string?)null)); await db.SaveChangesAsync(); await transaction.CommitAsync(); return Results.NoContent();
    }

    [Authorize(Roles = "superadmin"), HttpGet("admin/appointments")]
    public async Task<IResult> GlobalAppointments([FromQuery] string? query, [FromQuery] string? tenantId)
    {
        var appointments = db.Appointments.AsQueryable(); if (!string.IsNullOrWhiteSpace(tenantId)) appointments = appointments.Where(item => item.TenantId == tenantId); if (!string.IsNullOrWhiteSpace(query)) appointments = appointments.Where(item => item.CustomerName.Contains(query) || item.CustomerPhone.Contains(query)); return Results.Ok(await AppointmentQuery(appointments).ToListAsync());
    }

    [HttpGet("public/widgets/verify")]
    public async Task<IResult> VerifyWidget([FromQuery] string publishableKey)
    {
        if (string.IsNullOrWhiteSpace(publishableKey))
            return Results.BadRequest(new { error = "Publishable key is required." });

        var config = await db.TenantConfigs.SingleOrDefaultAsync(c => c.PublishableKey == publishableKey);
        if (config is null)
            return Results.NotFound(new { error = "Invalid publishable key." });

        var origin = Request.Headers.Origin.ToString();
        if (!string.IsNullOrWhiteSpace(config.AllowedDomains) && config.AllowedDomains != "*")
        {
            if (string.IsNullOrWhiteSpace(origin))
                return Results.Forbid();

            try
            {
                var allowedList = config.AllowedDomains.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var uri = new Uri(origin);
                var host = uri.Host;

                bool isAllowed = allowedList.Any(domain => 
                    domain.Equals(host, StringComparison.OrdinalIgnoreCase) || 
                    host.EndsWith("." + domain, StringComparison.OrdinalIgnoreCase));

                if (!isAllowed)
                    return Results.Forbid();
            }
            catch
            {
                return Results.Forbid();
            }
        }

        return Results.Ok(new { tenantId = config.TenantId });
    }

    private static IQueryable<AppointmentResponse> AppointmentQuery(IQueryable<AppointmentEntity> appointments) => appointments.OrderByDescending(item => item.StartTime).Select(item => new AppointmentResponse(item.AppointmentId, item.TenantId, item.CustomerName, item.CustomerPhone, item.Service, item.StartTime, item.EndTime, item.Status, item.Notes, item.CreatedAt));
    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateTenantRequest(string TenantId, string Name, string AdapterType, string? ApiBaseUrl, string? AuthHeaderName, string? AuthToken, string? AdminName, string AdminEmail, string AdminPassword, string? AdminPhone);
public sealed record AvailabilityRequest(string TimeZone, int SlotDurationMinutes, List<WorkingHoursRequest>? WorkingHours, List<HolidayRequest>? Holidays);
public sealed record WorkingHoursRequest(int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
public sealed record HolidayRequest(DateOnly HolidayDate, string? Name);
public sealed record AvailabilityResponse(string TimeZone, int SlotDurationMinutes, List<WorkingHoursResponse> WorkingHours, List<HolidayResponse> Holidays);
public sealed record WorkingHoursResponse(int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
public sealed record HolidayResponse(DateOnly HolidayDate, string? Name);
public sealed record SlotPageResponse(List<AvailabilitySlot> Items, int Total, int Page, int PageSize);
public sealed record ConfigRequest(string AdapterType, string? ApiBaseUrl, string? AuthHeaderName, string? AuthToken, string? ProductsApiUrl, string? InventorySource, string? PublishableKey, string? AllowedDomains);
public sealed record AppointmentResponse(string AppointmentId, string TenantId, string CustomerName, string CustomerPhone, string Service, DateTimeOffset StartTime, DateTimeOffset EndTime, string Status, string? Notes, DateTimeOffset CreatedAt);