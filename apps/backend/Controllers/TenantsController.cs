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
    public async Task<IResult> ListTenants()
    {
        var tenants = await db.Tenants.OrderByDescending(t => t.CreatedAt).ToListAsync();
        var subscriptions = await db.TenantSubscriptions.ToDictionaryAsync(s => s.TenantId);

        var responseList = tenants.Select(t => {
            subscriptions.TryGetValue(t.TenantId, out var sub);
            return new {
                t.TenantId,
                t.Name,
                t.Status,
                t.CreatedAt,
                Subscription = sub == null ? null : new {
                    sub.PlanName,
                    sub.MonthlyMinutesLimit,
                    sub.MinutesUsed,
                    sub.IsActive,
                    DaysLeft = (int)Math.Max(0, (sub.CurrentPeriodEnd - DateTimeOffset.UtcNow).TotalDays)
                }
            };
        });

        return Results.Ok(responseList);
    }

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

    [Authorize, HttpGet("tenants/{tenantId}/subscription")]
    public async Task<IResult> GetSubscription(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var sub = await db.TenantSubscriptions.SingleOrDefaultAsync(s => s.TenantId == tenantId);
        if (sub is null)
        {
            sub = new TenantSubscription
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = tenantId,
                PlanName = "Trial",
                MonthlyMinutesLimit = 30,
                MinutesUsed = 0.0,
                CurrentPeriodStart = DateTimeOffset.UtcNow,
                CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(14),
                IsActive = true
            };
            db.TenantSubscriptions.Add(sub);
            await db.SaveChangesAsync();
        }
        var daysLeft = (int)Math.Max(0, (sub.CurrentPeriodEnd - DateTimeOffset.UtcNow).TotalDays);
        return Results.Ok(new {
            sub.PlanName,
            sub.MonthlyMinutesLimit,
            sub.MinutesUsed,
            sub.IsActive,
            daysLeft
        });
    }

    [Authorize(Roles = "superadmin"), HttpPut("admin/tenants/{tenantId}/subscription")]
    public async Task<IResult> UpdateTenantSubscription(string tenantId, UpdateSubscriptionRequest request)
    {
        var sub = await db.TenantSubscriptions.SingleOrDefaultAsync(s => s.TenantId == tenantId);
        if (sub is null)
        {
            sub = new TenantSubscription
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = tenantId,
                PlanName = "Trial",
                MonthlyMinutesLimit = 30,
                MinutesUsed = 0.0,
                CurrentPeriodStart = DateTimeOffset.UtcNow,
                CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(14),
                IsActive = true
            };
            db.TenantSubscriptions.Add(sub);
        }

        sub.PlanName = request.PlanName;
        sub.MonthlyMinutesLimit = request.MonthlyMinutesLimit;
        sub.IsActive = request.IsActive;

        if (request.CurrentPeriodEnd.HasValue)
        {
            sub.CurrentPeriodEnd = request.CurrentPeriodEnd.Value;
        }
        else if (request.ResetPeriod || request.ResetMinutes || sub.CurrentPeriodEnd < DateTimeOffset.UtcNow)
        {
            sub.CurrentPeriodStart = DateTimeOffset.UtcNow;
            sub.CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(request.PlanName.Equals("Trial", StringComparison.OrdinalIgnoreCase) ? 14 : 30);
        }

        if (request.ResetMinutes)
        {
            sub.MinutesUsed = 0.0;
        }

        await db.SaveChangesAsync();
        return Results.NoContent();
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

    [AllowAnonymous, HttpGet("public/plans")]
    public async Task<IResult> PublicPlans()
    {
        var plans = await db.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.Price)
            .ToListAsync();
        return Results.Ok(plans);
    }

    [Authorize(Roles = "superadmin"), HttpGet("admin/plans")]
    public async Task<IResult> AdminPlans()
    {
        var plans = await db.SubscriptionPlans.OrderBy(p => p.Price).ToListAsync();
        return Results.Ok(plans);
    }

    [Authorize(Roles = "superadmin"), HttpPost("admin/plans")]
    public async Task<IResult> CreatePlan([FromBody] PlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlanName))
            return Results.BadRequest(new { error = "Plan name is required." });

        var plan = new SubscriptionPlan
        {
            Id = $"plan_{Guid.NewGuid().ToString("N")[..8]}",
            PlanName = request.PlanName.Trim(),
            MonthlyMinutesLimit = request.MonthlyMinutesLimit,
            Price = request.Price,
            Description = request.Description ?? "",
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.SubscriptionPlans.Add(plan);
        await db.SaveChangesAsync();
        return Results.Created($"/api/admin/plans/{plan.Id}", plan);
    }

    [Authorize(Roles = "superadmin"), HttpPut("admin/plans/{id}")]
    public async Task<IResult> UpdatePlan(string id, [FromBody] PlanRequest request)
    {
        var plan = await db.SubscriptionPlans.SingleOrDefaultAsync(p => p.Id == id);
        if (plan is null) return Results.NotFound();

        plan.PlanName = request.PlanName;
        plan.MonthlyMinutesLimit = request.MonthlyMinutesLimit;
        plan.Price = request.Price;
        plan.Description = request.Description ?? "";
        plan.IsActive = request.IsActive;

        await db.SaveChangesAsync();
        return Results.Ok(plan);
    }

    [Authorize(Roles = "superadmin"), HttpDelete("admin/plans/{id}")]
    public async Task<IResult> DeletePlan(string id)
    {
        var plan = await db.SubscriptionPlans.SingleOrDefaultAsync(p => p.Id == id);
        if (plan is null) return Results.NotFound();

        db.SubscriptionPlans.Remove(plan);
        await db.SaveChangesAsync();
        return Results.NoContent();
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
                var allowedList = config.AllowedDomains.Split(new char[] { ',', ' ', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var uri = new Uri(origin);
                var host = uri.Host;

                bool isAllowed = allowedList.Any(domain => {
                    var cleanDomain = domain;
                    var colonIdx = domain.IndexOf(':');
                    if (colonIdx >= 0) {
                        cleanDomain = domain.Substring(0, colonIdx);
                    }
                    cleanDomain = cleanDomain.TrimEnd('.');
                    return host.Equals(cleanDomain, StringComparison.OrdinalIgnoreCase) || 
                           host.EndsWith("." + cleanDomain, StringComparison.OrdinalIgnoreCase);
                });

                if (!isAllowed)
                    return Results.Forbid();
            }
            catch
            {
                return Results.Forbid();
            }
        }

        // Subscription Quota Check
        var subscription = await db.TenantSubscriptions.SingleOrDefaultAsync(s => s.TenantId == config.TenantId);
        if (subscription is null)
        {
            subscription = new TenantSubscription
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = config.TenantId,
                PlanName = "Trial",
                MonthlyMinutesLimit = 30, // 30 minutes of call packages
                MinutesUsed = 0.0,
                CurrentPeriodStart = DateTimeOffset.UtcNow,
                CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(14), // 14 days free trial
                IsActive = true
            };
            db.TenantSubscriptions.Add(subscription);
            await db.SaveChangesAsync();
        }

        if (!subscription.IsActive)
        {
            return Results.Json(new { error = "Subscription is inactive. Please contact support." }, statusCode: 402);
        }

        // Unlimited bypass for Superadmin overrides (e.g. for Alpha Devs)
        if (subscription.PlanName.Equals("Unlimited", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Ok(new { tenantId = config.TenantId, remainingSeconds = 1800 }); // standard Vapi session limit
        }

        // Trial expiration check
        if (subscription.PlanName.Equals("Trial", StringComparison.OrdinalIgnoreCase) && DateTimeOffset.UtcNow > subscription.CurrentPeriodEnd)
        {
            return Results.Json(new { error = "Your free trial has expired. Please upgrade your subscription." }, statusCode: 402);
        }

        if (subscription.MinutesUsed >= subscription.MonthlyMinutesLimit)
        {
            return Results.Json(new { error = "Call limit reached. Please upgrade your subscription." }, statusCode: 402);
        }

        var remainingSeconds = (int)((subscription.MonthlyMinutesLimit - subscription.MinutesUsed) * 60);

        return Results.Ok(new { tenantId = config.TenantId, remainingSeconds = remainingSeconds });
    }

    [HttpPost("public/webhooks/vapi/events")]
    public async Task<IResult> VapiWebhook([FromBody] System.Text.Json.Nodes.JsonNode payload)
    {
        try
        {
            var messageType = payload["message"]?["type"]?.GetValue<string>();
            if (messageType == "end-of-call-report" || messageType == "call.ended")
            {
                var tenantId = payload["message"]?["call"]?["assistantOverrides"]?["variableValues"]?["tenantId"]?.GetValue<string>()
                               ?? payload["message"]?["call"]?["assistantOverrides"]?["variableValues"]?["tenant_id"]?.GetValue<string>()
                               ?? payload["message"]?["call"]?["variableValues"]?["tenantId"]?.GetValue<string>()
                               ?? payload["message"]?["call"]?["variableValues"]?["tenant_id"]?.GetValue<string>()
                               ?? payload["message"]?["call"]?["assistant"]?["variableValues"]?["tenantId"]?.GetValue<string>()
                               ?? payload["message"]?["call"]?["assistant"]?["variableValues"]?["tenant_id"]?.GetValue<string>();
                
                double durationMinutes = 0;

                // 1. Try direct duration fields
                var durMinNode = payload["message"]?["durationMinutes"] ?? payload["message"]?["call"]?["durationMinutes"];
                if (durMinNode != null && double.TryParse(durMinNode.ToString(), out var parsedMin) && parsedMin > 0)
                {
                    durationMinutes = parsedMin;
                }
                else
                {
                    var durSecNode = payload["message"]?["durationSeconds"] ?? payload["message"]?["call"]?["durationSeconds"];
                    if (durSecNode != null && double.TryParse(durSecNode.ToString(), out var parsedSec) && parsedSec > 0)
                    {
                        durationMinutes = parsedSec / 60.0;
                    }
                    else
                    {
                        // 2. Fall back to parsing timestamps (checking both message level and message.call level)
                        var startedAtStr = payload["message"]?["startedAt"]?.GetValue<string>()
                                       ?? payload["message"]?["call"]?["startedAt"]?.GetValue<string>();
                        var endedAtStr = payload["message"]?["endedAt"]?.GetValue<string>()
                                     ?? payload["message"]?["call"]?["endedAt"]?.GetValue<string>();

                        if (!string.IsNullOrWhiteSpace(startedAtStr) && !string.IsNullOrWhiteSpace(endedAtStr))
                        {
                            if (DateTimeOffset.TryParse(startedAtStr, out var startedAt) && DateTimeOffset.TryParse(endedAtStr, out var endedAt))
                            {
                                durationMinutes = (endedAt - startedAt).TotalMinutes;
                            }
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(tenantId) && durationMinutes > 0)
                {
                    var subscription = await db.TenantSubscriptions.SingleOrDefaultAsync(s => s.TenantId == tenantId);
                    if (subscription is not null)
                    {
                        subscription.MinutesUsed += durationMinutes;
                        await db.SaveChangesAsync();
                        Console.WriteLine($"[Vapi Webhook] Successfully updated tenant {tenantId} call usage. Added {durationMinutes:F2} minutes. Total used: {subscription.MinutesUsed:F2}/{subscription.MonthlyMinutesLimit}");
                    }
                    else
                    {
                        Console.WriteLine($"[Vapi Webhook] Tenant subscription not found for tenantId: {tenantId}");
                    }
                }
                else
                {
                    Console.WriteLine($"[Vapi Webhook] Missing required fields. tenantId='{tenantId}', durationMinutes={durationMinutes}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Vapi webhook processing error: {ex.Message}");
        }
        return Results.Ok();
    }

    [HttpPost("public/webhooks/stripe")]
    public async Task<IResult> StripeWebhook([FromBody] System.Text.Json.Nodes.JsonNode payload)
    {
        try
        {
            var eventType = payload["type"]?.GetValue<string>();
            if (eventType == "checkout.session.completed" || eventType == "invoice.paid")
            {
                var sessionObj = payload["data"]?["object"];
                var tenantId = sessionObj?["client_reference_id"]?.GetValue<string>()
                               ?? sessionObj?["metadata"]?["tenantId"]?.GetValue<string>();
                var planName = sessionObj?["metadata"]?["planName"]?.GetValue<string>() ?? "Starter";
                int minutesLimit = 500;
                var minutesStr = sessionObj?["metadata"]?["monthlyMinutesLimit"]?.ToString();
                if (!string.IsNullOrWhiteSpace(minutesStr) && int.TryParse(minutesStr, out var parsedMinutes))
                {
                    minutesLimit = parsedMinutes;
                }

                if (!string.IsNullOrWhiteSpace(tenantId))
                {
                    var sub = await db.TenantSubscriptions.SingleOrDefaultAsync(s => s.TenantId == tenantId);
                    if (sub is null)
                    {
                        sub = new TenantSubscription { Id = Guid.NewGuid().ToString(), TenantId = tenantId };
                        db.TenantSubscriptions.Add(sub);
                    }

                    sub.PlanName = planName;
                    sub.MonthlyMinutesLimit = minutesLimit;
                    sub.MinutesUsed = 0.0;
                    sub.CurrentPeriodStart = DateTimeOffset.UtcNow;
                    sub.CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(30);
                    sub.IsActive = true;

                    await db.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Stripe webhook processing error: {ex.Message}");
        }
        return Results.Ok();
    }

    [Authorize]
    [HttpPost("tenants/{tenantId}/billing/checkout")]
    public async Task<IResult> CreateCheckoutSession(string tenantId, [FromBody] CheckoutRequest request, [FromServices] IConfiguration configuration)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();

        var stripeKey = configuration["Stripe:SecretKey"]
                        ?? Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");

        if (string.IsNullOrWhiteSpace(stripeKey) || stripeKey.Contains("dummy"))
        {
            return Results.Ok(new {
                url = (string?)null,
                message = "Stripe secret key is not configured. Please set SecretKey in appsettings or environment variables."
            });
        }

        var dbPlan = await db.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanName.ToLower() == request.PlanName.ToLower());
        int minutesLimit = dbPlan?.MonthlyMinutesLimit ?? (request.PlanName switch { "Pro" => 1500, "Premium" => 5000, _ => 500 });
        long unitAmountCents = (long)((dbPlan?.Price ?? (request.PlanName switch { "Pro" => 120.00m, "Premium" => 350.00m, _ => 50.00m })) * 100);

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", stripeKey);

            var origin = Request.Headers.Origin.ToString();
            if (string.IsNullOrWhiteSpace(origin)) origin = "http://localhost:3000";

            var encodedTenantId = Uri.EscapeDataString(tenantId);

            var formContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("payment_method_types[0]", "card"),
                new KeyValuePair<string, string>("mode", "payment"),
                new KeyValuePair<string, string>("line_items[0][price_data][currency]", "usd"),
                new KeyValuePair<string, string>("line_items[0][price_data][product_data][name]", $"{request.PlanName} Plan ({minutesLimit} Mins)"),
                new KeyValuePair<string, string>("line_items[0][price_data][unit_amount]", unitAmountCents.ToString()),
                new KeyValuePair<string, string>("line_items[0][quantity]", "1"),
                new KeyValuePair<string, string>("client_reference_id", tenantId),
                new KeyValuePair<string, string>("metadata[tenantId]", tenantId),
                new KeyValuePair<string, string>("metadata[planName]", request.PlanName),
                new KeyValuePair<string, string>("metadata[monthlyMinutesLimit]", minutesLimit.ToString()),
                new KeyValuePair<string, string>("success_url", $"{origin}/dashboard/{encodedTenantId}/billing?success=true"),
                new KeyValuePair<string, string>("cancel_url", $"{origin}/dashboard/{encodedTenantId}/billing?canceled=true"),
            });

            var response = await client.PostAsync("https://api.stripe.com/v1/checkout/sessions", formContent);
            var responseString = await response.Content.ReadAsStringAsync();
            var json = System.Text.Json.Nodes.JsonNode.Parse(responseString);

            if (response.IsSuccessStatusCode && json?["url"] != null)
            {
                return Results.Ok(new { url = json["url"]?.GetValue<string>() });
            }
            else
            {
                var err = json?["error"]?["message"]?.GetValue<string>() ?? "Failed to create Stripe Checkout Session.";
                return Results.Ok(new { url = (string?)null, message = err });
            }
        }
        catch (Exception ex)
        {
            return Results.Ok(new { url = (string?)null, message = $"Stripe error: {ex.Message}" });
        }
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
public sealed record UpdateSubscriptionRequest(string PlanName, int MonthlyMinutesLimit, bool IsActive, bool ResetMinutes, bool ResetPeriod, DateTimeOffset? CurrentPeriodEnd);
public sealed record CheckoutRequest(string PlanName);
public sealed record PlanRequest(string PlanName, int MonthlyMinutesLimit, decimal Price, string? Description, bool IsActive);