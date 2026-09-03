using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/staff-dispatch")]
public sealed class StaffDispatchController(AppDbContext dbContext) : ControllerBase
{
    public sealed record CreateRoleDto(
        string RoleName,
        string? Description
    );

    public sealed record CreateStaffMemberDto(
        string Name,
        string? Email,
        string? Phone,
        string? Role,
        string? Skills,
        string? Status
    );

    public sealed record UpdateStaffMemberDto(
        string Name,
        string? Email,
        string? Phone,
        string? Role,
        string? Skills,
        string? Status
    );

    public sealed record CreateShiftDto(
        string StaffName,
        string? StaffEmail,
        string Role,
        DateOnly ShiftDate,
        string StartTime,
        string EndTime,
        string? Status
    );

    public sealed record CreateTaskDto(
        string Title,
        string? Description,
        string? FulfillmentId,
        string AssignedToName,
        string? AssignedToEmail,
        string? Priority,
        DateTimeOffset? DueDate
    );

    public sealed record TaskCheckInDto(
        string Status, // pending, in_progress, completed, blocked
        string? CheckInNotes
    );

    // ================= Staff Roles =================
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles([FromRoute] string tenantId)
    {
        var customRoles = await dbContext.StaffRoles
            .Where(r => r.TenantId == tenantId)
            .OrderBy(r => r.RoleName)
            .ToListAsync();

        var standardRoles = new[]
        {
            new { Id = "role_tech", TenantId = tenantId, RoleName = "Lead Technician", Description = "Field technician handling on-site servicing & equipment diagnostics", IsBuiltIn = true },
            new { Id = "role_disp", TenantId = tenantId, RoleName = "Dispatcher", Description = "Coordinates incoming bookings, routes, and technician assignments", IsBuiltIn = true },
            new { Id = "role_driver", TenantId = tenantId, RoleName = "Driver / Delivery", Description = "Handles transport, field deliveries, and client pickups", IsBuiltIn = true },
            new { Id = "role_support", TenantId = tenantId, RoleName = "Support Agent", Description = "Customer support, inquiry answering, and escalations", IsBuiltIn = true },
            new { Id = "role_manager", TenantId = tenantId, RoleName = "Operations Manager", Description = "Oversees shift rosters, SLA fulfillment, and dispatch analytics", IsBuiltIn = true },
        };

        var result = standardRoles.Concat(customRoles.Select(c => new {
            Id = c.Id,
            TenantId = c.TenantId,
            RoleName = c.RoleName,
            Description = c.Description ?? "Custom team role",
            IsBuiltIn = false
        })).ToList();

        return Ok(result);
    }

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole([FromRoute] string tenantId, [FromBody] CreateRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RoleName))
        {
            return BadRequest("Role name is required.");
        }

        var role = new StaffRole
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            RoleName = dto.RoleName.Trim(),
            Description = dto.Description?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.StaffRoles.Add(role);
        await dbContext.SaveChangesAsync();

        return Ok(new {
            Id = role.Id,
            TenantId = role.TenantId,
            RoleName = role.RoleName,
            Description = role.Description ?? "Custom team role",
            IsBuiltIn = false
        });
    }

    [HttpDelete("roles/{id}")]
    public async Task<IActionResult> DeleteRole([FromRoute] string tenantId, [FromRoute] string id)
    {
        var role = await dbContext.StaffRoles.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Id == id);
        if (role == null) return NotFound("Role not found or is built-in.");

        dbContext.StaffRoles.Remove(role);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ================= Staff Members Directory =================
    [HttpGet("members")]
    public async Task<IActionResult> GetStaffMembers([FromRoute] string tenantId)
    {
        var members = await dbContext.StaffMembers
            .Where(m => m.TenantId == tenantId)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return Ok(members);
    }

    [HttpPost("members")]
    public async Task<IActionResult> CreateStaffMember([FromRoute] string tenantId, [FromBody] CreateStaffMemberDto dto)
    {
        var member = new StaffMember
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "technician" : dto.Role.ToLower(),
            Skills = dto.Skills,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status.ToLower(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.StaffMembers.Add(member);
        await dbContext.SaveChangesAsync();

        return Ok(member);
    }

    [HttpPut("members/{id}")]
    public async Task<IActionResult> UpdateStaffMember([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdateStaffMemberDto dto)
    {
        var member = await dbContext.StaffMembers.FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (member == null) return NotFound("Staff member not found.");

        member.Name = dto.Name;
        member.Email = dto.Email;
        member.Phone = dto.Phone;
        member.Role = string.IsNullOrWhiteSpace(dto.Role) ? "technician" : dto.Role.ToLower();
        member.Skills = dto.Skills;
        member.Status = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status.ToLower();
        member.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(member);
    }

    [HttpDelete("members/{id}")]
    public async Task<IActionResult> DeleteStaffMember([FromRoute] string tenantId, [FromRoute] string id)
    {
        var member = await dbContext.StaffMembers.FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (member == null) return NotFound("Staff member not found.");

        dbContext.StaffMembers.Remove(member);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ================= Shift Calendar =================

    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts([FromRoute] string tenantId)
    {
        var shifts = await dbContext.StaffShifts
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.ShiftDate)
            .ThenBy(s => s.StartTime)
            .ToListAsync();

        return Ok(shifts);
    }

    [HttpPost("shifts")]
    public async Task<IActionResult> CreateShift([FromRoute] string tenantId, [FromBody] CreateShiftDto dto)
    {
        var shift = new StaffShift
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            StaffName = dto.StaffName,
            StaffEmail = dto.StaffEmail,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "technician" : dto.Role.ToLower(),
            ShiftDate = dto.ShiftDate,
            StartTime = string.IsNullOrWhiteSpace(dto.StartTime) ? "09:00" : dto.StartTime,
            EndTime = string.IsNullOrWhiteSpace(dto.EndTime) ? "17:00" : dto.EndTime,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "scheduled" : dto.Status.ToLower(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.StaffShifts.Add(shift);
        await dbContext.SaveChangesAsync();

        return Ok(shift);
    }

    [HttpDelete("shifts/{id}")]
    public async Task<IActionResult> DeleteShift([FromRoute] string tenantId, [FromRoute] string id)
    {
        var shift = await dbContext.StaffShifts.FirstOrDefaultAsync(s => s.TenantId == tenantId && s.Id == id);
        if (shift == null) return NotFound("Shift not found.");

        dbContext.StaffShifts.Remove(shift);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks([FromRoute] string tenantId)
    {
        var tasks = await dbContext.DispatchTasks
            .Where(t => t.TenantId == tenantId)
            .OrderByDescending(t => t.DueDate)
            .ToListAsync();

        var pendingCount = tasks.Count(t => t.Status == "pending");
        var inProgressCount = tasks.Count(t => t.Status == "in_progress");
        var completedCount = tasks.Count(t => t.Status == "completed");
        var blockedCount = tasks.Count(t => t.Status == "blocked");

        return Ok(new {
            TotalTasks = tasks.Count,
            PendingCount = pendingCount,
            InProgressCount = inProgressCount,
            CompletedCount = completedCount,
            BlockedCount = blockedCount,
            Tasks = tasks
        });
    }

    [HttpPost("tasks")]
    public async Task<IActionResult> CreateTask([FromRoute] string tenantId, [FromBody] CreateTaskDto dto)
    {
        var task = new DispatchTask
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Title = dto.Title,
            Description = dto.Description,
            FulfillmentId = dto.FulfillmentId,
            AssignedToName = dto.AssignedToName,
            AssignedToEmail = dto.AssignedToEmail,
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "medium" : dto.Priority.ToLower(),
            Status = "pending",
            DueDate = dto.DueDate ?? DateTimeOffset.UtcNow.AddDays(1),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.DispatchTasks.Add(task);
        await dbContext.SaveChangesAsync();

        return Ok(task);
    }

    [HttpPut("tasks/{id}/checkin")]
    public async Task<IActionResult> CheckInTask([FromRoute] string tenantId, [FromRoute] string id, [FromBody] TaskCheckInDto dto)
    {
        var task = await dbContext.DispatchTasks.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == id);
        if (task == null) return NotFound("Task not found.");

        task.Status = dto.Status.ToLower();
        task.CheckInNotes = dto.CheckInNotes;
        if (dto.Status.ToLower() == "completed")
        {
            task.CompletedAt = DateTimeOffset.UtcNow;
        }
        task.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(task);
    }

    [HttpDelete("tasks/{id}")]
    public async Task<IActionResult> DeleteTask([FromRoute] string tenantId, [FromRoute] string id)
    {
        var task = await dbContext.DispatchTasks.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == id);
        if (task == null) return NotFound("Task not found.");

        dbContext.DispatchTasks.Remove(task);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
