using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Alpha.Appointment.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/email-alerts")]
public sealed class EmailAlertsController(AppDbContext dbContext, IEmailNotificationService emailService) : ControllerBase
{
    public sealed record SendConfirmationDto(
        string RecipientEmail,
        string RecipientName,
        string ReferenceType, // appointment, order, invoice
        string ReferenceId,
        string DetailsSummary
    );

    public sealed record GenerateDigestDto(
        string PeriodType, // daily, monthly
        string RecipientEmail,
        string RecipientName
    );

    public sealed record TriggerEscalationDto(
        string LeadOrCustomerName,
        string CustomerPhone,
        string? CustomerEmail,
        string EscalationReason, // VIP Lead, Missed Call Escalation, Delinquent Balance
        string RecipientAdminEmail
    );

    public sealed record NotifyStaffFulfillmentDto(
        string? FulfillmentId,
        string StaffName,
        string StaffEmail,
        string ServiceTitle,
        string CustomerName,
        string CustomerPhone,
        string? CustomerEmail,
        DateTimeOffset? ScheduledAt,
        string? Priority,
        string? Notes
    );

    public sealed record NotifyStaffTaskDto(
        string? TaskId,
        string TaskTitle,
        string AssignedToName,
        string AssignedToEmail,
        string? Priority,
        DateTimeOffset? DueDate,
        string? Description
    );

    public sealed record NotifyStaffShiftDto(
        string StaffName,
        string StaffEmail,
        string? Role,
        DateOnly ShiftDate,
        string StartTime,
        string EndTime
    );

    [HttpGet]
    public async Task<IActionResult> GetEmailLogs([FromRoute] string tenantId)
    {
        var logs = await dbContext.EmailLogsAlerts
            .Where(e => e.TenantId == tenantId)
            .OrderByDescending(e => e.SentAt)
            .ToListAsync();

        var confirmationCount = logs.Count(l => l.EmailType == "transactional_confirmation");
        var digestCount = logs.Count(l => l.EmailType.StartsWith("financial_digest"));
        var escalationCount = logs.Count(l => l.EmailType == "escalation_alert");

        return Ok(new {
            TotalLogs = logs.Count,
            ConfirmationCount = confirmationCount,
            DigestCount = digestCount,
            EscalationCount = escalationCount,
            Logs = logs
        });
    }

    [HttpPost("send-confirmation")]
    public async Task<IActionResult> SendConfirmation([FromRoute] string tenantId, [FromBody] SendConfirmationDto dto)
    {
        var subject = $"Booking & Order Confirmation: #{dto.ReferenceId.Substring(0, Math.Min(8, dto.ReferenceId.Length))}";
        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;'>
                <div style='background: #0f766e; color: white; padding: 15px; border-radius: 6px; text-align: center;'>
                    <h2 style='margin: 0;'>Booking Confirmation</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p>Dear <strong>{dto.RecipientName}</strong>,</p>
                    <p>Your request has been successfully confirmed. Below are your booking details:</p>
                    <div style='background: #f8fafc; padding: 15px; border-left: 4px solid #0f766e; border-radius: 4px;'>
                        <p style='margin: 0;'><strong>Reference Type:</strong> {dto.ReferenceType}</p>
                        <p style='margin: 5px 0 0 0;'><strong>Details:</strong> {dto.DetailsSummary}</p>
                    </div>
                    <p style='margin-top: 20px; font-size: 13px; color: #64748b;'>If you have any questions or need to reschedule, simply reply to this email.</p>
                </div>
            </div>
        ";
        var text = $"Hi {dto.RecipientName}, your {dto.ReferenceType} request has been confirmed. {dto.DetailsSummary}";

        var (success, _, _) = await emailService.SendEmailAsync(dto.RecipientEmail, subject, html, text);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = "transactional_confirmation",
            RecipientEmail = dto.RecipientEmail,
            RecipientName = dto.RecipientName,
            Subject = subject,
            BodyPreview = text,
            Status = success ? "delivered" : "failed",
            TriggeredBy = "ai_receptionist",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpPost("generate-digest")]
    public async Task<IActionResult> GenerateDigest([FromRoute] string tenantId, [FromBody] GenerateDigestDto dto)
    {
        var period = dto.PeriodType.ToLower() == "monthly" ? "monthly" : "daily";

        // Aggregate actual financials & metrics
        var invoices = await dbContext.Invoices.Where(i => i.TenantId == tenantId).ToListAsync();
        var orders = await dbContext.UnifiedOrders.Where(o => o.TenantId == tenantId).ToListAsync();
        var appointments = await dbContext.Appointments.Where(a => a.TenantId == tenantId).ToListAsync();

        var totalCollected = invoices.Sum(i => i.AmountPaid);
        var totalOrdersRevenue = orders.Sum(o => o.TotalAmount);
        var completedAppointments = appointments.Count(a => a.Status == "booked" || a.Status == "completed");

        var digestSubject = period == "monthly"
            ? $"Monthly Executive Financial Digest - {DateTime.UtcNow:MMMM yyyy}"
            : $"Daily Business Operations Summary - {DateTime.UtcNow:yyyy-MM-dd}";

        var body = $"Executive Summary: Total Collected: ${totalCollected:F2}, Orders Volume: ${totalOrdersRevenue:F2} ({orders.Count} orders), Active Bookings: {completedAppointments} services.";

        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;'>
                <div style='background: #1e3a8a; color: white; padding: 15px; border-radius: 6px; text-align: center;'>
                    <h2 style='margin: 0;'>{digestSubject}</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p>Dear <strong>{dto.RecipientName}</strong>,</p>
                    <p>Here is your end-of-period operational & financial digest:</p>
                    <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;'>
                        <div style='background: #eff6ff; padding: 12px; border-radius: 6px;'>
                            <span style='font-size: 11px; color: #1e40af;'>TOTAL COLLECTED</span>
                            <h3 style='margin: 5px 0 0 0; color: #1e3a8a;'>${totalCollected:F2}</h3>
                        </div>
                        <div style='background: #f0fdf4; padding: 12px; border-radius: 6px;'>
                            <span style='font-size: 11px; color: #166534;'>ORDERS VOLUME</span>
                            <h3 style='margin: 5px 0 0 0; color: #14532d;'>${totalOrdersRevenue:F2}</h3>
                        </div>
                    </div>
                    <p><strong>Total Orders Processed:</strong> {orders.Count}</p>
                    <p><strong>Active Service Bookings:</strong> {completedAppointments}</p>
                </div>
            </div>
        ";

        var (success, _, _) = await emailService.SendEmailAsync(dto.RecipientEmail, digestSubject, html, body);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = period == "monthly" ? "financial_digest_monthly" : "financial_digest_daily",
            RecipientEmail = dto.RecipientEmail,
            RecipientName = dto.RecipientName,
            Subject = digestSubject,
            BodyPreview = body,
            Status = success ? "sent" : "failed",
            TriggeredBy = "system_cron",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpPost("trigger-escalation")]
    public async Task<IActionResult> TriggerEscalation([FromRoute] string tenantId, [FromBody] TriggerEscalationDto dto)
    {
        var subject = $"[URGENT ESCALATION] {dto.EscalationReason} - {dto.LeadOrCustomerName}";
        var body = $"Immediate attention required for {dto.LeadOrCustomerName} ({dto.CustomerPhone}). Reason: {dto.EscalationReason}. Please review in the Operations dispatch console.";

        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e11d48; border-radius: 8px;'>
                <div style='background: #e11d48; color: white; padding: 15px; border-radius: 6px; text-align: center;'>
                    <h2 style='margin: 0;'>🚨 Operations Escalation Alert</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p style='color: #9f1239; font-weight: bold;'>Attention Operations Lead,</p>
                    <p>A high-priority escalation has been triggered:</p>
                    <div style='background: #fff1f2; padding: 15px; border-left: 4px solid #e11d48; border-radius: 4px;'>
                        <p style='margin: 0;'><strong>Customer / Lead:</strong> {dto.LeadOrCustomerName}</p>
                        <p style='margin: 5px 0 0 0;'><strong>Phone:</strong> {dto.CustomerPhone}</p>
                        <p style='margin: 5px 0 0 0;'><strong>Reason:</strong> {dto.EscalationReason}</p>
                    </div>
                </div>
            </div>
        ";

        var (success, _, _) = await emailService.SendEmailAsync(dto.RecipientAdminEmail, subject, html, body);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = "escalation_alert",
            RecipientEmail = dto.RecipientAdminEmail,
            RecipientName = "Operations Admin",
            Subject = subject,
            BodyPreview = body,
            Status = success ? "sent" : "failed",
            TriggeredBy = "admin_dispatch",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpPost("notify-staff-fulfillment")]
    public async Task<IActionResult> NotifyStaffFulfillment([FromRoute] string tenantId, [FromBody] NotifyStaffFulfillmentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StaffEmail))
        {
            return BadRequest("Staff email is required for notification.");
        }

        var priorityBadge = dto.Priority?.ToLower() switch
        {
            "urgent" => "🔥 URGENT",
            "vip" => "⭐ VIP CLIENT",
            _ => "STANDARD"
        };

        var scheduledStr = dto.ScheduledAt.HasValue
            ? dto.ScheduledAt.Value.ToString("f")
            : "To be scheduled";

        var subject = $"[Job Assignment] {priorityBadge}: {dto.ServiceTitle} for {dto.CustomerName}";
        var body = $"Hello {dto.StaffName}, you have been assigned to fulfill '{dto.ServiceTitle}'. Customer: {dto.CustomerName} ({dto.CustomerPhone}). Scheduled: {scheduledStr}. Notes: {dto.Notes ?? "None"}";

        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;'>
                <div style='background: #0f766e; color: white; padding: 16px; border-radius: 6px; text-align: center;'>
                    <span style='font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;'>Service Fulfillment Assignment</span>
                    <h2 style='margin: 8px 0 0 0;'>{dto.ServiceTitle}</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p>Hello <strong>{dto.StaffName}</strong>,</p>
                    <p>You have been assigned to coordinate and complete the following service request:</p>
                    
                    <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0f766e; padding: 15px; border-radius: 4px; margin: 15px 0;'>
                        <table style='width: 100%; font-size: 14px; border-collapse: collapse;'>
                            <tr><td style='padding: 4px 0; color: #64748b; width: 140px;'><strong>Customer Name:</strong></td><td style='padding: 4px 0; font-weight: bold; color: #0f172a;'>{dto.CustomerName}</td></tr>
                            <tr><td style='padding: 4px 0; color: #64748b;'><strong>Customer Phone:</strong></td><td style='padding: 4px 0; font-weight: bold; color: #0f172a;'><a href='tel:{dto.CustomerPhone}' style='color: #0f766e;'>{dto.CustomerPhone}</a></td></tr>
                            {(string.IsNullOrWhiteSpace(dto.CustomerEmail) ? "" : $"<tr><td style='padding: 4px 0; color: #64748b;'><strong>Customer Email:</strong></td><td style='padding: 4px 0; color: #0f172a;'>{dto.CustomerEmail}</td></tr>")}
                            <tr><td style='padding: 4px 0; color: #64748b;'><strong>Priority:</strong></td><td style='padding: 4px 0;'><span style='background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px;'>{priorityBadge}</span></td></tr>
                            <tr><td style='padding: 4px 0; color: #64748b;'><strong>Scheduled Time:</strong></td><td style='padding: 4px 0; font-weight: bold; color: #0f172a;'>{scheduledStr}</td></tr>
                        </table>
                    </div>

                    <div style='background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px;'>
                        <strong style='color: #334155;'>Job Instructions & Notes:</strong>
                        <p style='margin: 5px 0 0 0; color: #475569;'>{dto.Notes ?? "No additional internal notes provided."}</p>
                    </div>

                    <p style='margin-top: 20px; font-size: 12px; color: #94a3b8;'>Please log in to your mobile operations console to check in and update this job status once completed.</p>
                </div>
            </div>
        ";

        var (success, _, _) = await emailService.SendEmailAsync(dto.StaffEmail, subject, html, body);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = "staff_fulfillment_assignment",
            RecipientEmail = dto.StaffEmail,
            RecipientName = dto.StaffName,
            Subject = subject,
            BodyPreview = body,
            Status = success ? "delivered" : "failed",
            TriggeredBy = "fulfillment_dispatch",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpPost("notify-staff-task")]
    public async Task<IActionResult> NotifyStaffTask([FromRoute] string tenantId, [FromBody] NotifyStaffTaskDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AssignedToEmail))
        {
            return BadRequest("Staff email is required for task notification.");
        }

        var dueStr = dto.DueDate.HasValue ? dto.DueDate.Value.ToString("f") : "As soon as possible";
        var subject = $"[Task Dispatch] New Assignment: {dto.TaskTitle} (Due: {dueStr})";
        var body = $"Hi {dto.AssignedToName}, you have been assigned a new task: '{dto.TaskTitle}'. Priority: {dto.Priority ?? "Medium"}. Deadline: {dueStr}. Instructions: {dto.Description ?? "None"}";

        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;'>
                <div style='background: #0284c7; color: white; padding: 16px; border-radius: 6px; text-align: center;'>
                    <span style='font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;'>Task Ticket Dispatch</span>
                    <h2 style='margin: 8px 0 0 0;'>{dto.TaskTitle}</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p>Hi <strong>{dto.AssignedToName}</strong>,</p>
                    <p>You have a new dispatch assignment ticket:</p>
                    
                    <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; padding: 15px; border-radius: 4px; margin: 15px 0;'>
                        <p style='margin: 0;'><strong>Priority:</strong> <span style='text-transform: uppercase; font-weight: bold;'>{dto.Priority ?? "Medium"}</span></p>
                        <p style='margin: 8px 0 0 0;'><strong>Target Deadline:</strong> {dueStr}</p>
                    </div>

                    <div style='background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px;'>
                        <strong style='color: #334155;'>Instructions & Description:</strong>
                        <p style='margin: 5px 0 0 0; color: #475569;'>{dto.Description ?? "No description provided."}</p>
                    </div>

                    <p style='margin-top: 20px; font-size: 12px; color: #94a3b8;'>Use the mobile check-in action in your dashboard when starting or finishing this task.</p>
                </div>
            </div>
        ";

        var (success, _, _) = await emailService.SendEmailAsync(dto.AssignedToEmail, subject, html, body);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = "staff_task_assignment",
            RecipientEmail = dto.AssignedToEmail,
            RecipientName = dto.AssignedToName,
            Subject = subject,
            BodyPreview = body,
            Status = success ? "delivered" : "failed",
            TriggeredBy = "task_dispatch",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpPost("notify-staff-shift")]
    public async Task<IActionResult> NotifyStaffShift([FromRoute] string tenantId, [FromBody] NotifyStaffShiftDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StaffEmail))
        {
            return BadRequest("Staff email is required for shift notification.");
        }

        var subject = $"[Shift Schedule] Upcoming Shift on {dto.ShiftDate:MMMM dd, yyyy} ({dto.StartTime} - {dto.EndTime})";
        var body = $"Hi {dto.StaffName}, your upcoming shift as '{dto.Role ?? "Staff"}' has been scheduled for {dto.ShiftDate:yyyy-MM-dd} from {dto.StartTime} to {dto.EndTime}.";

        var html = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;'>
                <div style='background: #4f46e5; color: white; padding: 16px; border-radius: 6px; text-align: center;'>
                    <span style='font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;'>Shift Schedule Notice</span>
                    <h2 style='margin: 8px 0 0 0;'>{dto.ShiftDate:dddd, MMMM dd, yyyy}</h2>
                </div>
                <div style='padding: 20px 0;'>
                    <p>Hi <strong>{dto.StaffName}</strong>,</p>
                    <p>Your work roster for the upcoming shift has been confirmed:</p>
                    
                    <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; padding: 15px; border-radius: 4px; margin: 15px 0;'>
                        <p style='margin: 0;'><strong>Assigned Role:</strong> {dto.Role ?? "Team Member"}</p>
                        <p style='margin: 8px 0 0 0;'><strong>Working Hours:</strong> <span style='font-weight: bold; color: #4f46e5;'>{dto.StartTime} – {dto.EndTime}</span></p>
                    </div>

                    <p style='margin-top: 20px; font-size: 12px; color: #94a3b8;'>Please arrive on time. Contact your shift manager in advance if you require shift adjustments.</p>
                </div>
            </div>
        ";

        var (success, _, _) = await emailService.SendEmailAsync(dto.StaffEmail, subject, html, body);

        var log = new EmailLogAlert
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            EmailType = "staff_shift_scheduled",
            RecipientEmail = dto.StaffEmail,
            RecipientName = dto.StaffName,
            Subject = subject,
            BodyPreview = body,
            Status = success ? "delivered" : "failed",
            TriggeredBy = "shift_scheduling",
            SentAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.EmailLogsAlerts.Add(log);
        await dbContext.SaveChangesAsync();

        return Ok(log);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmailLog([FromRoute] string tenantId, [FromRoute] string id)
    {
        var log = await dbContext.EmailLogsAlerts.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == id);
        if (log == null) return NotFound("Email log not found.");

        dbContext.EmailLogsAlerts.Remove(log);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
