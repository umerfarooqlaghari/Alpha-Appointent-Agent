using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/fulfillment")]
public sealed class FulfillmentController(AppDbContext dbContext) : ControllerBase
{
    public sealed record CreateFulfillmentDto(
        string? ReferenceType,
        string? ReferenceId,
        string CustomerName,
        string CustomerPhone,
        string? CustomerEmail,
        string ServiceTitle,
        DateTimeOffset? ScheduledAt,
        string? Priority,
        string? AssignedStaffId,
        string? AssignedStaffName,
        string? Notes
    );

    public sealed record UpdateStatusDto(string Status);
    public sealed record UpdatePriorityDto(string Priority);
    public sealed record AssignStaffDto(string? StaffId, string StaffName);

    [HttpGet]
    public async Task<IActionResult> GetFulfillments([FromRoute] string tenantId)
    {
        var fulfillments = await dbContext.ServiceFulfillments
            .Where(f => f.TenantId == tenantId)
            .OrderByDescending(f => f.ScheduledAt)
            .ToListAsync();

        // Also fetch active appointments to offer 1-click sync if not already in fulfillment
        var appointments = await dbContext.Appointments
            .Where(a => a.TenantId == tenantId)
            .OrderByDescending(a => a.StartTime)
            .Take(50)
            .ToListAsync();

        var queuedRefIds = fulfillments
            .Where(f => f.ReferenceId != null)
            .Select(f => f.ReferenceId!)
            .ToHashSet();

        var unsyncedAppointments = appointments
            .Where(a => !queuedRefIds.Contains(a.AppointmentId))
            .Select(a => new {
                a.AppointmentId,
                a.CustomerName,
                a.CustomerPhone,
                ServiceTitle = a.Service,
                ScheduledAt = a.StartTime,
                a.Notes,
                a.Status
            })
            .ToList();

        var urgentCount = fulfillments.Count(f => f.Priority == "urgent" || f.Priority == "vip");
        var activeCount = fulfillments.Count(f => f.Status == "in_progress" || f.Status == "confirmed");
        var completedCount = fulfillments.Count(f => f.Status == "completed");

        return Ok(new {
            TotalFulfillments = fulfillments.Count,
            UrgentCount = urgentCount,
            ActiveCount = activeCount,
            CompletedCount = completedCount,
            Queue = fulfillments,
            UnsyncedAppointments = unsyncedAppointments
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateFulfillment([FromRoute] string tenantId, [FromBody] CreateFulfillmentDto dto)
    {
        var fulfillment = new ServiceFulfillment
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            ReferenceType = string.IsNullOrWhiteSpace(dto.ReferenceType) ? "manual" : dto.ReferenceType,
            ReferenceId = dto.ReferenceId,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerEmail = dto.CustomerEmail,
            ServiceTitle = dto.ServiceTitle,
            ScheduledAt = dto.ScheduledAt ?? DateTimeOffset.UtcNow.AddHours(2),
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "normal" : dto.Priority.ToLower(),
            Status = "queued",
            AssignedStaffId = dto.AssignedStaffId,
            AssignedStaffName = dto.AssignedStaffName,
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.ServiceFulfillments.Add(fulfillment);
        await dbContext.SaveChangesAsync();

        return Ok(fulfillment);
    }

    [HttpPost("sync-appointment/{appointmentId}")]
    public async Task<IActionResult> SyncAppointment([FromRoute] string tenantId, [FromRoute] string appointmentId)
    {
        var appt = await dbContext.Appointments
            .FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AppointmentId == appointmentId);

        if (appt == null) return NotFound("Appointment not found.");

        var existing = await dbContext.ServiceFulfillments
            .FirstOrDefaultAsync(f => f.TenantId == tenantId && f.ReferenceId == appointmentId);

        if (existing != null) return Ok(existing);

        var fulfillment = new ServiceFulfillment
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            ReferenceType = "appointment",
            ReferenceId = appt.AppointmentId,
            CustomerName = appt.CustomerName,
            CustomerPhone = appt.CustomerPhone,
            ServiceTitle = appt.Service,
            ScheduledAt = appt.StartTime,
            Priority = "normal",
            Status = "confirmed",
            Notes = appt.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.ServiceFulfillments.Add(fulfillment);
        await dbContext.SaveChangesAsync();

        return Ok(fulfillment);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdateStatusDto dto)
    {
        var item = await dbContext.ServiceFulfillments.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
        if (item == null) return NotFound("Fulfillment record not found.");

        item.Status = dto.Status.ToLower();
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(item);
    }

    [HttpPut("{id}/priority")]
    public async Task<IActionResult> UpdatePriority([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdatePriorityDto dto)
    {
        var item = await dbContext.ServiceFulfillments.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
        if (item == null) return NotFound("Fulfillment record not found.");

        item.Priority = dto.Priority.ToLower();
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(item);
    }

    [HttpPut("{id}/assign")]
    public async Task<IActionResult> AssignStaff([FromRoute] string tenantId, [FromRoute] string id, [FromBody] AssignStaffDto dto)
    {
        var item = await dbContext.ServiceFulfillments.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
        if (item == null) return NotFound("Fulfillment record not found.");

        item.AssignedStaffId = dto.StaffId;
        item.AssignedStaffName = dto.StaffName;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFulfillment([FromRoute] string tenantId, [FromRoute] string id)
    {
        var item = await dbContext.ServiceFulfillments.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
        if (item == null) return NotFound("Fulfillment record not found.");

        dbContext.ServiceFulfillments.Remove(item);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
