using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/expenses")]
public sealed class ExpensesController(AppDbContext dbContext) : ControllerBase
{
    public sealed record LogExpenseDto(
        string Title,
        string Category, // supplies, utilities, payroll, cogs_materials, marketing, rent, other
        decimal Amount,
        string? VendorName,
        string? AssociatedItemId,
        string? ReceiptUrl,
        DateTimeOffset? ExpenseDate,
        string? Notes
    );

    public sealed record CogsMarginItem(
        string ItemId,
        string ItemName,
        string Category,
        decimal SalePrice,
        decimal UnitCogs,
        decimal GrossProfit,
        double GrossMarginPercentage,
        int UnitsSold,
        decimal TotalCogsLogged
    );

    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromRoute] string tenantId)
    {
        var expenses = await dbContext.Expenses
            .Where(e => e.TenantId == tenantId)
            .OrderByDescending(e => e.ExpenseDate)
            .ToListAsync();

        var totalAmount = expenses.Sum(e => e.Amount);
        var categoryTotals = expenses
            .GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

        return Ok(new {
            TotalExpenses = totalAmount,
            CategoryTotals = categoryTotals,
            Expenses = expenses
        });
    }

    [HttpPost]
    public async Task<IActionResult> LogExpense([FromRoute] string tenantId, [FromBody] LogExpenseDto dto)
    {
        var expense = new Expense
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Title = dto.Title,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "supplies" : dto.Category.ToLower(),
            Amount = dto.Amount,
            VendorName = dto.VendorName,
            AssociatedItemId = dto.AssociatedItemId,
            ReceiptUrl = dto.ReceiptUrl,
            ExpenseDate = dto.ExpenseDate ?? DateTimeOffset.UtcNow,
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Expenses.Add(expense);
        await dbContext.SaveChangesAsync();

        return Ok(expense);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense([FromRoute] string tenantId, [FromRoute] string id)
    {
        var expense = await dbContext.Expenses.FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id);
        if (expense == null) return NotFound("Expense not found.");

        dbContext.Expenses.Remove(expense);
        await dbContext.SaveChangesAsync();

        return Ok(new { success = true });
    }

    public sealed record SetItemCogsDto(decimal UnitCogs, string? ItemType);

    [HttpPut("cogs/{itemId}")]
    public async Task<IActionResult> SetItemCogs([FromRoute] string tenantId, [FromRoute] string itemId, [FromBody] SetItemCogsDto dto)
    {
        var record = await dbContext.ItemCogs.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.ItemId == itemId);
        if (record == null)
        {
            record = new ItemCogs
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = tenantId,
                ItemId = itemId,
                ItemType = dto.ItemType ?? "item",
                UnitCogs = Math.Max(0, dto.UnitCogs),
                UpdatedAt = DateTimeOffset.UtcNow
            };
            dbContext.ItemCogs.Add(record);
        }
        else
        {
            record.UnitCogs = Math.Max(0, dto.UnitCogs);
            record.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpGet("cogs-margins")]
    public async Task<IActionResult> GetCogsMargins([FromRoute] string tenantId)
    {
        var catalogItems = await dbContext.Items.Where(i => i.TenantId == tenantId).ToListAsync();
        var services = await dbContext.Services.Where(s => s.TenantId == tenantId).ToListAsync();
        var directCogsEntries = await dbContext.ItemCogs.Where(c => c.TenantId == tenantId).ToListAsync();
        var directCogsMap = directCogsEntries.ToDictionary(c => c.ItemId, c => c.UnitCogs);

        var cogsExpenses = await dbContext.Expenses
            .Where(e => e.TenantId == tenantId && (e.Category == "cogs_materials" || e.AssociatedItemId != null))
            .ToListAsync();

        var directOrderItems = await dbContext.UnifiedOrderItems.ToListAsync();
        var restaurantOrderItems = await dbContext.OrderItems.ToListAsync();

        var result = new List<CogsMarginItem>();

        foreach (var item in catalogItems)
        {
            var itemExpenses = cogsExpenses.Where(e => e.AssociatedItemId == item.Id).ToList();
            var totalCogsLogged = itemExpenses.Sum(e => e.Amount);

            // Units sold
            int directQty = directOrderItems.Where(oi => oi.Name.Equals(item.Name, StringComparison.OrdinalIgnoreCase)).Sum(oi => oi.Quantity);
            int restQty = restaurantOrderItems.Where(oi => oi.ItemId == item.Id).Sum(oi => oi.Quantity);
            int unitsSold = directQty + restQty;

            decimal unitCogs = 0m;
            if (directCogsMap.TryGetValue(item.Id, out var manualCogs))
            {
                unitCogs = manualCogs;
            }
            else if (totalCogsLogged > 0 && unitsSold > 0)
            {
                unitCogs = totalCogsLogged / unitsSold;
            }
            else if (totalCogsLogged > 0)
            {
                unitCogs = totalCogsLogged;
            }

            decimal grossProfit = Math.Max(0, item.Price - unitCogs);
            double margin = item.Price > 0 ? Math.Round((double)(grossProfit / item.Price) * 100, 1) : 0;

            result.Add(new CogsMarginItem(
                item.Id,
                item.Name,
                string.IsNullOrWhiteSpace(item.Category) ? "Product" : item.Category,
                item.Price,
                Math.Round(unitCogs, 2),
                Math.Round(grossProfit, 2),
                margin,
                unitsSold,
                totalCogsLogged
            ));
        }

        foreach (var svc in services)
        {
            var svcPrice = svc.Price ?? 0m;
            var svcExpenses = cogsExpenses.Where(e => e.AssociatedItemId == svc.Id).ToList();
            var totalCogs = svcExpenses.Sum(e => e.Amount);

            decimal unitCogs = 0m;
            if (directCogsMap.TryGetValue(svc.Id, out var manualCogs))
            {
                unitCogs = manualCogs;
            }
            else if (totalCogs > 0)
            {
                unitCogs = totalCogs;
            }

            decimal grossProfit = Math.Max(0, svcPrice - unitCogs);
            double margin = svcPrice > 0 ? Math.Round((double)(grossProfit / svcPrice) * 100, 1) : 0;

            result.Add(new CogsMarginItem(
                svc.Id,
                svc.Name,
                "Service",
                svcPrice,
                Math.Round(unitCogs, 2),
                Math.Round(grossProfit, 2),
                margin,
                0,
                totalCogs
            ));
        }

        return Ok(result);
    }
}
