using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/leads")]
public sealed class LeadsController(AppDbContext dbContext) : ControllerBase
{
    public sealed record CreateLeadDto(
        string Name,
        string Phone,
        string? Email,
        string? Stage,
        string? AssignedTo,
        string? Summary,
        string? Source,
        string? CallLogIdentifier
    );

    public sealed record UpdateLeadDto(
        string Name,
        string Phone,
        string? Email,
        string? Summary,
        string? AssignedTo,
        string? CallLogIdentifier
    );

    public sealed record UpdateStageDto(
        string Stage
    );

    public sealed record AutoCaptureLeadDto(
        string Phone,
        string? CustomerName,
        string? Summary,
        string Source,
        string? CallLogIdentifier
    );

    public sealed record CreateTaskDto(
        string Title,
        DateTimeOffset? DueDate,
        string? AssignedTo
    );

    public sealed record UpdateTaskDto(
        bool IsCompleted
    );

    [HttpGet]
    public async Task<IActionResult> GetLeads([FromRoute] string tenantId)
    {
        var leads = await dbContext.Leads
            .Where(l => l.TenantId == tenantId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        var tasks = await dbContext.LeadTasks
            .Where(t => t.TenantId == tenantId)
            .ToListAsync();

        var result = leads.Select(l => new {
            l.Id,
            l.TenantId,
            l.CallLogIdentifier,
            l.Name,
            l.Phone,
            l.Email,
            l.Stage,
            l.Score,
            l.AssignedTo,
            l.Summary,
            l.Source,
            l.CreatedAt,
            l.UpdatedAt,
            Tasks = tasks.Where(t => t.LeadId == l.Id).OrderBy(t => t.CreatedAt).ToList()
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLead([FromRoute] string tenantId, [FromBody] CreateLeadDto dto)
    {
        var leadId = Guid.NewGuid().ToString();
        var score = CalculateLeadScore(dto.Phone, dto.Email, dto.Summary, dto.Source ?? "manual");

        var lead = new Lead
        {
            Id = leadId,
            TenantId = tenantId,
            CallLogIdentifier = dto.CallLogIdentifier,
            Name = string.IsNullOrWhiteSpace(dto.Name) ? "New Lead" : dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Stage = string.IsNullOrWhiteSpace(dto.Stage) ? "new" : dto.Stage.ToLower(),
            Score = score,
            AssignedTo = dto.AssignedTo ?? "Sales Rep",
            Summary = dto.Summary,
            Source = string.IsNullOrWhiteSpace(dto.Source) ? "manual" : dto.Source.ToLower(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Leads.Add(lead);

        // Auto-assign initial follow-up task
        var autoTask = new LeadTask
        {
            Id = Guid.NewGuid().ToString(),
            LeadId = leadId,
            TenantId = tenantId,
            Title = $"Initial Follow-up: Call {lead.Phone}",
            DueDate = DateTimeOffset.UtcNow.AddHours(24),
            IsCompleted = false,
            AssignedTo = lead.AssignedTo,
            CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.LeadTasks.Add(autoTask);

        await dbContext.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPost("auto-capture")]
    public async Task<IActionResult> AutoCaptureLead([FromRoute] string tenantId, [FromBody] AutoCaptureLeadDto dto)
    {
        var existingLead = await dbContext.Leads
            .FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Phone == dto.Phone);

        if (existingLead != null)
        {
            existingLead.Summary = dto.Summary ?? existingLead.Summary;
            existingLead.Score = Math.Min(100, existingLead.Score + 15);
            existingLead.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync();
            return Ok(existingLead);
        }

        var leadId = Guid.NewGuid().ToString();
        var score = CalculateLeadScore(dto.Phone, null, dto.Summary, dto.Source);

        var lead = new Lead
        {
            Id = leadId,
            TenantId = tenantId,
            CallLogIdentifier = dto.CallLogIdentifier,
            Name = string.IsNullOrWhiteSpace(dto.CustomerName) ? $"Lead ({dto.Phone})" : dto.CustomerName,
            Phone = dto.Phone,
            Stage = "new",
            Score = score,
            AssignedTo = "AI Sales Desk",
            Summary = dto.Summary,
            Source = dto.Source,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Leads.Add(lead);

        var autoTask = new LeadTask
        {
            Id = Guid.NewGuid().ToString(),
            LeadId = leadId,
            TenantId = tenantId,
            Title = $"Automated Call Follow-up for {lead.Name}",
            DueDate = DateTimeOffset.UtcNow.AddHours(4),
            IsCompleted = false,
            AssignedTo = lead.AssignedTo,
            CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.LeadTasks.Add(autoTask);

        await dbContext.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLead([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdateLeadDto dto)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id);
        if (lead == null) return NotFound("Lead not found.");

        lead.Name = string.IsNullOrWhiteSpace(dto.Name) ? lead.Name : dto.Name;
        lead.Phone = string.IsNullOrWhiteSpace(dto.Phone) ? lead.Phone : dto.Phone;
        lead.Email = dto.Email;
        lead.Summary = dto.Summary;
        lead.AssignedTo = dto.AssignedTo ?? lead.AssignedTo;
        lead.CallLogIdentifier = dto.CallLogIdentifier;
        lead.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLead([FromRoute] string tenantId, [FromRoute] string id)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id);
        if (lead == null) return NotFound("Lead not found.");

        var tasks = await dbContext.LeadTasks.Where(t => t.LeadId == id).ToListAsync();
        dbContext.LeadTasks.RemoveRange(tasks);
        dbContext.Leads.Remove(lead);

        await dbContext.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPut("{id}/stage")]
    public async Task<IActionResult> UpdateStage([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdateStageDto dto)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id);
        if (lead == null) return NotFound("Lead not found.");

        lead.Stage = dto.Stage.ToLower();
        lead.UpdatedAt = DateTimeOffset.UtcNow;

        if (lead.Stage == "qualified")
        {
            lead.Score = Math.Max(lead.Score, 75);
            dbContext.LeadTasks.Add(new LeadTask
            {
                Id = Guid.NewGuid().ToString(),
                LeadId = lead.Id,
                TenantId = tenantId,
                Title = "Prepare Estimate / Proposal",
                DueDate = DateTimeOffset.UtcNow.AddDays(1),
                IsCompleted = false,
                AssignedTo = lead.AssignedTo,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }
        else if (lead.Stage == "won")
        {
            lead.Score = 100;
        }

        await dbContext.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPost("{id}/tasks")]
    public async Task<IActionResult> AddTask([FromRoute] string tenantId, [FromRoute] string id, [FromBody] CreateTaskDto dto)
    {
        var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id);
        if (lead == null) return NotFound("Lead not found.");

        var task = new LeadTask
        {
            Id = Guid.NewGuid().ToString(),
            LeadId = id,
            TenantId = tenantId,
            Title = dto.Title,
            DueDate = dto.DueDate ?? DateTimeOffset.UtcNow.AddDays(1),
            IsCompleted = false,
            AssignedTo = dto.AssignedTo ?? lead.AssignedTo,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.LeadTasks.Add(task);
        await dbContext.SaveChangesAsync();
        return Ok(task);
    }

    [HttpPut("{id}/tasks/{taskId}")]
    public async Task<IActionResult> UpdateTaskStatus([FromRoute] string tenantId, [FromRoute] string id, [FromRoute] string taskId, [FromBody] UpdateTaskDto dto)
    {
        var task = await dbContext.LeadTasks.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.LeadId == id && t.Id == taskId);
        if (task == null) return NotFound("Task not found.");

        task.IsCompleted = dto.IsCompleted;
        await dbContext.SaveChangesAsync();
        return Ok(task);
    }

    private static int CalculateLeadScore(string phone, string? email, string? summary, string source)
    {
        int score = 40;
        if (!string.IsNullOrWhiteSpace(phone)) score += 20;
        if (!string.IsNullOrWhiteSpace(email)) score += 15;
        if (!string.IsNullOrWhiteSpace(summary)) score += 15;
        if (source == "voice_call") score += 10;
        return Math.Min(100, score);
    }
}
