using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/invoices")]
public sealed class InvoicesController(AppDbContext dbContext) : ControllerBase
{
    public sealed record InvoiceItemDto(
        string ItemName,
        int Quantity,
        decimal UnitPrice
    );

    public sealed record CreateInvoiceDto(
        string CustomerName,
        string CustomerPhone,
        string? CustomerEmail,
        string? OrderId,
        string? QuoteId,
        string? LeadId,
        string? InvoiceType, // one_time, recurring_monthly, recurring_yearly
        decimal TaxAmount,
        decimal DiscountAmount,
        decimal DepositRequired,
        DateTimeOffset DueDate,
        string? Notes,
        List<InvoiceItemDto> Items
    );

    public sealed record RecordPaymentDto(
        decimal Amount,
        string? PaymentMethod, // card, cash, bank_transfer, local_gateway
        string? TransactionReference
    );

    [HttpGet]
    public async Task<IActionResult> GetInvoices([FromRoute] string tenantId)
    {
        var invoices = await dbContext.Invoices
            .Where(i => i.TenantId == tenantId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var invoiceIds = invoices.Select(i => i.Id).ToList();

        var items = await dbContext.InvoiceItems
            .Where(item => invoiceIds.Contains(item.InvoiceId))
            .ToListAsync();

        var payments = await dbContext.InvoicePayments
            .Where(p => invoiceIds.Contains(p.InvoiceId))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = invoices.Select(i => new {
            i.Id,
            i.TenantId,
            i.InvoiceNumber,
            i.CustomerName,
            i.CustomerPhone,
            i.CustomerEmail,
            i.OrderId,
            i.QuoteId,
            i.LeadId,
            i.InvoiceType,
            i.Subtotal,
            i.TaxAmount,
            i.DiscountAmount,
            i.TotalAmount,
            i.DepositRequired,
            i.AmountPaid,
            i.Status,
            i.DueDate,
            i.PaymentLink,
            i.PaymentGateway,
            i.LastReminderSentAt,
            i.DunningStatus,
            i.Notes,
            i.CreatedAt,
            i.UpdatedAt,
            Items = items.Where(it => it.InvoiceId == i.Id).ToList(),
            Payments = payments.Where(p => p.InvoiceId == i.Id).ToList()
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromRoute] string tenantId, [FromBody] CreateInvoiceDto dto)
    {
        var invoiceId = Guid.NewGuid().ToString();
        var count = await dbContext.Invoices.CountAsync(i => i.TenantId == tenantId);
        var invoiceNumber = $"INV-{DateTime.UtcNow.Year}-{(count + 1):D4}";

        decimal subtotal = 0;
        var itemsList = new List<InvoiceItem>();

        foreach (var item in dto.Items ?? new List<InvoiceItemDto>())
        {
            var lineTotal = item.Quantity * item.UnitPrice;
            subtotal += lineTotal;

            itemsList.Add(new InvoiceItem
            {
                Id = Guid.NewGuid().ToString(),
                InvoiceId = invoiceId,
                ItemName = item.ItemName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = lineTotal
            });
        }

        var totalAmount = Math.Max(0, subtotal + dto.TaxAmount - dto.DiscountAmount);
        var paymentLink = $"https://checkout.stripe.com/pay/{tenantId}/{invoiceId}";

        var invoice = new Invoice
        {
            Id = invoiceId,
            TenantId = tenantId,
            InvoiceNumber = invoiceNumber,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerEmail = dto.CustomerEmail,
            OrderId = dto.OrderId,
            QuoteId = dto.QuoteId,
            LeadId = dto.LeadId,
            InvoiceType = string.IsNullOrWhiteSpace(dto.InvoiceType) ? "one_time" : dto.InvoiceType.ToLower(),
            Subtotal = subtotal,
            TaxAmount = dto.TaxAmount,
            DiscountAmount = dto.DiscountAmount,
            TotalAmount = totalAmount,
            DepositRequired = dto.DepositRequired > 0 ? dto.DepositRequired : totalAmount,
            AmountPaid = 0,
            Status = "unpaid",
            DueDate = dto.DueDate == default ? DateTimeOffset.UtcNow.AddDays(7) : dto.DueDate,
            PaymentLink = paymentLink,
            PaymentGateway = "stripe",
            DunningStatus = "pending",
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Invoices.Add(invoice);
        dbContext.InvoiceItems.AddRange(itemsList);
        await dbContext.SaveChangesAsync();

        return Ok(new {
            invoice.Id,
            invoice.TenantId,
            invoice.InvoiceNumber,
            invoice.CustomerName,
            invoice.CustomerPhone,
            invoice.CustomerEmail,
            invoice.InvoiceType,
            invoice.Subtotal,
            invoice.TaxAmount,
            invoice.DiscountAmount,
            invoice.TotalAmount,
            invoice.DepositRequired,
            invoice.AmountPaid,
            invoice.Status,
            invoice.DueDate,
            invoice.PaymentLink,
            invoice.PaymentGateway,
            invoice.Notes,
            invoice.CreatedAt,
            Items = itemsList,
            Payments = new List<InvoicePayment>()
        });
    }

    [HttpPost("{id}/payments")]
    public async Task<IActionResult> RecordPayment([FromRoute] string tenantId, [FromRoute] string id, [FromBody] RecordPaymentDto dto)
    {
        var invoice = await dbContext.Invoices.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id);
        if (invoice == null) return NotFound("Invoice not found.");

        if (dto.Amount <= 0) return BadRequest("Payment amount must be greater than zero.");

        var paymentId = Guid.NewGuid().ToString();
        var receiptUrl = $"/receipts/{tenantId}/{paymentId}";

        var payment = new InvoicePayment
        {
            Id = paymentId,
            InvoiceId = id,
            TenantId = tenantId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod ?? "card",
            TransactionReference = dto.TransactionReference ?? $"TXN-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
            ReceiptUrl = receiptUrl,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.InvoicePayments.Add(payment);

        invoice.AmountPaid += dto.Amount;
        if (invoice.AmountPaid >= invoice.TotalAmount)
        {
            invoice.Status = "paid";
            invoice.DunningStatus = "settled";
        }
        else if (invoice.AmountPaid > 0)
        {
            invoice.Status = "partially_paid";
        }
        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new {
            Invoice = invoice,
            Payment = payment
        });
    }

    [HttpPost("{id}/send-link")]
    public async Task<IActionResult> SendPaymentLink([FromRoute] string tenantId, [FromRoute] string id)
    {
        var invoice = await dbContext.Invoices.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id);
        if (invoice == null) return NotFound("Invoice not found.");

        invoice.LastReminderSentAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        var balance = invoice.TotalAmount - invoice.AmountPaid;
        var summaryText = $"Hi {invoice.CustomerName}, your invoice {invoice.InvoiceNumber} for ${balance:F2} is ready. Secure online payment link: {invoice.PaymentLink}";

        var whatsappUrl = $"https://wa.me/{invoice.CustomerPhone.Replace("+", "").Replace(" ", "")}?text={Uri.EscapeDataString(summaryText)}";
        var smsUrl = $"sms:{invoice.CustomerPhone}?body={Uri.EscapeDataString(summaryText)}";

        return Ok(new {
            invoiceNumber = invoice.InvoiceNumber,
            paymentLink = invoice.PaymentLink,
            summaryText,
            whatsappUrl,
            smsUrl
        });
    }

    [HttpPut("{id}/bad-debt")]
    public async Task<IActionResult> FlagBadDebt([FromRoute] string tenantId, [FromRoute] string id)
    {
        var invoice = await dbContext.Invoices.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id);
        if (invoice == null) return NotFound("Invoice not found.");

        invoice.Status = "bad_debt";
        invoice.DunningStatus = "written_off";
        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();
        return Ok(invoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice([FromRoute] string tenantId, [FromRoute] string id)
    {
        var invoice = await dbContext.Invoices.FirstOrDefaultAsync(i => i.TenantId == tenantId && i.Id == id);
        if (invoice == null) return NotFound("Invoice not found.");

        var items = await dbContext.InvoiceItems.Where(it => it.InvoiceId == id).ToListAsync();
        var payments = await dbContext.InvoicePayments.Where(p => p.InvoiceId == id).ToListAsync();

        dbContext.InvoiceItems.RemoveRange(items);
        dbContext.InvoicePayments.RemoveRange(payments);
        dbContext.Invoices.Remove(invoice);

        await dbContext.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
