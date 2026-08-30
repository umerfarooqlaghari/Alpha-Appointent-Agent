using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/receivables")]
public sealed class ReceivablesController(AppDbContext dbContext) : ControllerBase
{
    public sealed record AgingBucket(
        string BucketName, // Current, 1-30 Days, 31-60 Days, 61-90 Days, 90+ Days
        decimal Amount,
        int InvoiceCount
    );

    public sealed record ReceivablesSummaryResponse(
        decimal TotalOutstanding,
        decimal TotalOverdue,
        int TotalUnpaidCount,
        int OverdueCount,
        List<AgingBucket> AgingReport,
        List<object> OverdueInvoices
    );

    [HttpGet]
    public async Task<IActionResult> GetReceivables([FromRoute] string tenantId)
    {
        var invoices = await dbContext.Invoices
            .Where(i => i.TenantId == tenantId && i.Status != "paid" && i.Status != "cancelled")
            .OrderByDescending(i => i.DueDate)
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;

        decimal currentAmount = 0;
        int currentCount = 0;

        decimal days1To30 = 0;
        int count1To30 = 0;

        decimal days31To60 = 0;
        int count31To60 = 0;

        decimal days61To90 = 0;
        int count61To90 = 0;

        decimal days90Plus = 0;
        int count90Plus = 0;

        decimal totalOutstanding = 0;
        decimal totalOverdue = 0;
        int overdueCount = 0;

        var overdueInvoicesList = new List<object>();

        foreach (var inv in invoices)
        {
            var unpaidBalance = Math.Max(0, inv.TotalAmount - inv.AmountPaid);
            totalOutstanding += unpaidBalance;

            var daysPastDue = (int)(now - inv.DueDate).TotalDays;

            if (daysPastDue <= 0)
            {
                // Current / Not Overdue yet
                currentAmount += unpaidBalance;
                currentCount++;
            }
            else
            {
                totalOverdue += unpaidBalance;
                overdueCount++;

                if (daysPastDue <= 30)
                {
                    days1To30 += unpaidBalance;
                    count1To30++;
                }
                else if (daysPastDue <= 60)
                {
                    days31To60 += unpaidBalance;
                    count31To60++;
                }
                else if (daysPastDue <= 90)
                {
                    days61To90 += unpaidBalance;
                    count61To90++;
                }
                else
                {
                    days90Plus += unpaidBalance;
                    count90Plus++;
                }
            }

            overdueInvoicesList.Add(new {
                inv.Id,
                inv.InvoiceNumber,
                inv.CustomerName,
                inv.CustomerPhone,
                inv.CustomerEmail,
                inv.TotalAmount,
                inv.AmountPaid,
                UnpaidBalance = unpaidBalance,
                inv.Status,
                inv.DueDate,
                DaysPastDue = daysPastDue,
                inv.PaymentLink,
                inv.LastReminderSentAt,
                inv.DunningStatus,
                inv.CreatedAt
            });
        }

        var agingReport = new List<AgingBucket>
        {
            new("Current (Not Due)", currentAmount, currentCount),
            new("1 - 30 Days", days1To30, count1To30),
            new("31 - 60 Days", days31To60, count31To60),
            new("61 - 90 Days", days61To90, count61To90),
            new("90+ Days Overdue", days90Plus, count90Plus)
        };

        var response = new ReceivablesSummaryResponse(
            totalOutstanding,
            totalOverdue,
            invoices.Count,
            overdueCount,
            agingReport,
            overdueInvoicesList
        );

        return Ok(response);
    }

    [HttpPost("dunning/trigger")]
    public async Task<IActionResult> TriggerDunningCycle([FromRoute] string tenantId)
    {
        var unpaidInvoices = await dbContext.Invoices
            .Where(i => i.TenantId == tenantId && i.Status != "paid" && i.Status != "cancelled" && i.Status != "bad_debt")
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;
        int remindersDispatched = 0;

        foreach (var inv in unpaidInvoices)
        {
            var daysUntilDue = (int)(inv.DueDate - now).TotalDays;
            var daysPastDue = (int)(now - inv.DueDate).TotalDays;

            // Scenario 1: 3 days before due date
            if (daysUntilDue >= 0 && daysUntilDue <= 3 && inv.DunningStatus == "pending")
            {
                inv.DunningStatus = "reminded_pre_due";
                inv.LastReminderSentAt = now;
                remindersDispatched++;
            }
            // Scenario 2: 2+ days past due date
            else if (daysPastDue >= 2 && daysPastDue < 30)
            {
                inv.DunningStatus = "reminded_overdue";
                inv.LastReminderSentAt = now;
                inv.Status = "overdue";
                remindersDispatched++;
            }
            // Scenario 3: 30+ days past due date (escalation)
            else if (daysPastDue >= 30)
            {
                inv.DunningStatus = "escalated";
                inv.LastReminderSentAt = now;
                inv.Status = "overdue";
                remindersDispatched++;
            }
        }

        await dbContext.SaveChangesAsync();

        return Ok(new {
            success = true,
            remindersDispatched,
            timestamp = now,
            message = $"Automated dunning cycle evaluated {unpaidInvoices.Count} open balances. Dispatched {remindersDispatched} automated reminders."
        });
    }
}
