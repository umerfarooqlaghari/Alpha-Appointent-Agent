using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/quotes")]
public sealed class QuotesController(AppDbContext dbContext) : ControllerBase
{
    public sealed record QuoteItemDto(
        string ItemName,
        int Quantity,
        decimal UnitPrice
    );

    public sealed record CreateQuoteDto(
        string? LeadId,
        string CustomerName,
        string CustomerPhone,
        string? CustomerEmail,
        decimal TaxRate,
        decimal DiscountAmount,
        List<QuoteItemDto> Items
    );

    public sealed record SignQuoteDto(
        string DigitalSignature
    );

    [HttpGet]
    public async Task<IActionResult> GetQuotes([FromRoute] string tenantId)
    {
        var quotes = await dbContext.Quotes
            .Where(q => q.TenantId == tenantId)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        var items = await dbContext.QuoteItems
            .Where(qi => quotes.Select(q => q.Id).Contains(qi.QuoteId))
            .ToListAsync();

        var result = quotes.Select(q => new {
            q.Id,
            q.TenantId,
            q.LeadId,
            q.CustomerName,
            q.CustomerPhone,
            q.CustomerEmail,
            q.Status,
            q.Subtotal,
            q.TaxRate,
            q.TaxAmount,
            q.DiscountAmount,
            q.TotalAmount,
            q.DigitalSignature,
            q.SignedAt,
            q.CreatedAt,
            q.UpdatedAt,
            Items = items.Where(i => i.QuoteId == q.Id).ToList()
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateQuote([FromRoute] string tenantId, [FromBody] CreateQuoteDto dto)
    {
        var quoteId = Guid.NewGuid().ToString();
        decimal subtotal = 0;
        var itemsList = new List<QuoteItem>();

        foreach (var itemDto in dto.Items ?? new List<QuoteItemDto>())
        {
            var totalPrice = itemDto.Quantity * itemDto.UnitPrice;
            subtotal += totalPrice;

            itemsList.Add(new QuoteItem
            {
                Id = Guid.NewGuid().ToString(),
                QuoteId = quoteId,
                ItemName = itemDto.ItemName,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                TotalPrice = totalPrice
            });
        }

        var taxAmount = Math.Round(subtotal * (dto.TaxRate / 100m), 2);
        var totalAmount = Math.Max(0, subtotal + taxAmount - dto.DiscountAmount);

        var quote = new Quote
        {
            Id = quoteId,
            TenantId = tenantId,
            LeadId = dto.LeadId,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            CustomerEmail = dto.CustomerEmail,
            Status = "draft",
            Subtotal = subtotal,
            TaxRate = dto.TaxRate,
            TaxAmount = taxAmount,
            DiscountAmount = dto.DiscountAmount,
            TotalAmount = totalAmount,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Quotes.Add(quote);
        dbContext.QuoteItems.AddRange(itemsList);

        // If lead exists, update lead stage to proposal
        if (!string.IsNullOrWhiteSpace(dto.LeadId))
        {
            var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == dto.LeadId);
            if (lead != null)
            {
                lead.Stage = "proposal";
                lead.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await dbContext.SaveChangesAsync();

        return Ok(new {
            quote.Id,
            quote.TenantId,
            quote.LeadId,
            quote.CustomerName,
            quote.CustomerPhone,
            quote.CustomerEmail,
            quote.Status,
            quote.Subtotal,
            quote.TaxRate,
            quote.TaxAmount,
            quote.DiscountAmount,
            quote.TotalAmount,
            quote.CreatedAt,
            Items = itemsList
        });
    }

    [HttpPost("{id}/sign")]
    public async Task<IActionResult> SignQuote([FromRoute] string tenantId, [FromRoute] string id, [FromBody] SignQuoteDto dto)
    {
        var quote = await dbContext.Quotes.FirstOrDefaultAsync(q => q.TenantId == tenantId && q.Id == id);
        if (quote == null) return NotFound("Quote not found.");

        quote.DigitalSignature = dto.DigitalSignature;
        quote.SignedAt = DateTimeOffset.UtcNow;
        quote.Status = "approved";
        quote.UpdatedAt = DateTimeOffset.UtcNow;

        if (!string.IsNullOrWhiteSpace(quote.LeadId))
        {
            var lead = await dbContext.Leads.FirstOrDefaultAsync(l => l.TenantId == tenantId && l.Id == quote.LeadId);
            if (lead != null)
            {
                lead.Stage = "won";
                lead.Score = 100;
                lead.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await dbContext.SaveChangesAsync();
        return Ok(quote);
    }

    [HttpPost("{id}/convert")]
    public async Task<IActionResult> ConvertToOrder([FromRoute] string tenantId, [FromRoute] string id)
    {
        var quote = await dbContext.Quotes.FirstOrDefaultAsync(q => q.TenantId == tenantId && q.Id == id);
        if (quote == null) return NotFound("Quote not found.");

        var quoteItems = await dbContext.QuoteItems.Where(qi => qi.QuoteId == id).ToListAsync();

        var orderId = Guid.NewGuid().ToString();
        var unifiedOrder = new UnifiedOrder
        {
            Id = orderId,
            TenantId = tenantId,
            CustomerName = quote.CustomerName,
            CustomerPhone = quote.CustomerPhone,
            Source = "manual",
            OrderType = "service_booking",
            ScheduledDate = DateTimeOffset.UtcNow.AddDays(1),
            Status = "in_progress",
            TotalAmount = quote.TotalAmount,
            Notes = $"Converted from Approved Quote #{quote.Id[..8]}",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var orderItems = quoteItems.Select(qi => new UnifiedOrderItem
        {
            Id = Guid.NewGuid().ToString(),
            OrderId = orderId,
            Name = qi.ItemName,
            Quantity = qi.Quantity,
            UnitPrice = qi.UnitPrice
        }).ToList();

        quote.Status = "converted";
        quote.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.UnifiedOrders.Add(unifiedOrder);
        dbContext.UnifiedOrderItems.AddRange(orderItems);

        await dbContext.SaveChangesAsync();

        return Ok(new { Order = unifiedOrder, Items = orderItems });
    }

    [HttpGet("{id}/share-link")]
    public async Task<IActionResult> GetShareLink([FromRoute] string tenantId, [FromRoute] string id)
    {
        var quote = await dbContext.Quotes.FirstOrDefaultAsync(q => q.TenantId == tenantId && q.Id == id);
        if (quote == null) return NotFound("Quote not found.");

        var items = await dbContext.QuoteItems.Where(qi => qi.QuoteId == id).ToListAsync();

        var textSummary = $"Estimate #{quote.Id[..8]} for {quote.CustomerName}:\n" +
            string.Join("\n", items.Select(i => $"- {i.ItemName} x{i.Quantity}: ${i.TotalPrice:F2}")) +
            $"\nTotal: ${quote.TotalAmount:F2}\nStatus: {quote.Status.ToUpper()}";

        var encodedText = Uri.EscapeDataString(textSummary);
        var whatsappUrl = $"https://wa.me/{quote.CustomerPhone.Replace("+", "").Replace(" ", "")}?text={encodedText}";
        var smsUrl = $"sms:{quote.CustomerPhone}?body={encodedText}";

        return Ok(new { QuoteId = id, WhatsAppUrl = whatsappUrl, SmsUrl = smsUrl, SummaryText = textSummary });
    }
}
