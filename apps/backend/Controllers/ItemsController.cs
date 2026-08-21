using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/items")]
[Authorize]
public sealed class ItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetItems(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var items = await db.Items
            .Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.Name)
            .ToListAsync();
        return Results.Ok(items);
    }

    [HttpPost]
    public async Task<IResult> CreateItem(string tenantId, CreateItemRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Sku))
            return Results.BadRequest(new { error = "Name and SKU are required." });

        // Check unique SKU per tenant
        var exists = await db.Items.AnyAsync(item => item.TenantId == tenantId && item.Sku == request.Sku);
        if (exists) return Results.Conflict(new { error = "SKU already exists for this tenant." });

        var newItem = new Item
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Name = request.Name,
            Sku = request.Sku,
            Description = request.Description,
            Category = request.Category,
            Price = request.Price,
            StockStatus = request.StockStatus ?? "in_stock",
            Variations = request.Variations ?? "[]",
            CustomVariables = request.CustomVariables ?? "{}",
            IsDisabled = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Items.Add(newItem);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/items/{newItem.Id}", newItem);
    }

    [HttpPut("{itemId}")]
    public async Task<IResult> UpdateItem(string tenantId, string itemId, UpdateItemRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Sku))
            return Results.BadRequest(new { error = "Name and SKU are required." });

        var item = await db.Items.SingleOrDefaultAsync(i => i.TenantId == tenantId && i.Id == itemId);
        if (item is null) return Results.NotFound();

        // Check if SKU is changing and already exists
        if (item.Sku != request.Sku)
        {
            var exists = await db.Items.AnyAsync(i => i.TenantId == tenantId && i.Sku == request.Sku && i.Id != itemId);
            if (exists) return Results.Conflict(new { error = "SKU already exists for this tenant." });
        }

        item.Name = request.Name;
        item.Sku = request.Sku;
        item.Description = request.Description;
        item.Category = request.Category;
        item.Price = request.Price;
        item.StockStatus = request.StockStatus ?? "in_stock";
        item.Variations = request.Variations ?? "[]";
        item.CustomVariables = request.CustomVariables ?? "{}";
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(item);
    }

    [HttpDelete("{itemId}")]
    public async Task<IResult> DeleteItem(string tenantId, string itemId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var item = await db.Items.SingleOrDefaultAsync(i => i.TenantId == tenantId && i.Id == itemId);
        if (item is null) return Results.NotFound();

        db.Items.Remove(item);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    [HttpPut("{itemId}/disable")]
    public async Task<IResult> DisableItem(string tenantId, string itemId, DisableItemRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var item = await db.Items.SingleOrDefaultAsync(i => i.TenantId == tenantId && i.Id == itemId);
        if (item is null) return Results.NotFound();

        item.IsDisabled = request.IsDisabled;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(item);
    }

    [HttpPost("bulk")]
    public async Task<IResult> BulkUpload(string tenantId, List<BulkItemRow> request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (request == null || request.Count == 0) return Results.BadRequest(new { error = "No items provided." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var skus = request.Select(r => r.Sku).Distinct().ToList();
            var existingItems = await db.Items
                .Where(i => i.TenantId == tenantId && skus.Contains(i.Sku))
                .ToDictionaryAsync(i => i.Sku);

            var itemsToUpdate = new List<Item>();
            var itemsToAdd = new List<Item>();

            foreach (var row in request)
            {
                if (string.IsNullOrWhiteSpace(row.Name) || string.IsNullOrWhiteSpace(row.Sku))
                {
                    return Results.BadRequest(new { error = "Each item must have a Name and SKU." });
                }

                if (existingItems.TryGetValue(row.Sku, out var existingItem))
                {
                    existingItem.Name = row.Name;
                    existingItem.Description = row.Description;
                    existingItem.Category = row.Category;
                    existingItem.Price = row.Price;
                    existingItem.StockStatus = row.StockStatus ?? "in_stock";
                    existingItem.Variations = row.Variations ?? "[]";
                    existingItem.CustomVariables = row.CustomVariables ?? "{}";
                    existingItem.UpdatedAt = DateTimeOffset.UtcNow;
                    itemsToUpdate.Add(existingItem);
                }
                else
                {
                    var newItem = new Item
                    {
                        Id = Guid.NewGuid().ToString(),
                        TenantId = tenantId,
                        Name = row.Name,
                        Sku = row.Sku,
                        Description = row.Description,
                        Category = row.Category,
                        Price = row.Price,
                        StockStatus = row.StockStatus ?? "in_stock",
                        Variations = row.Variations ?? "[]",
                        CustomVariables = row.CustomVariables ?? "{}",
                        IsDisabled = false,
                        CreatedAt = DateTimeOffset.UtcNow,
                        UpdatedAt = DateTimeOffset.UtcNow
                    };
                    itemsToAdd.Add(newItem);
                }
            }

            if (itemsToAdd.Count > 0)
            {
                db.Items.AddRange(itemsToAdd);
            }
            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Results.Ok(new { message = $"Successfully processed {request.Count} items. (Added: {itemsToAdd.Count}, Updated: {itemsToUpdate.Count})" });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Results.BadRequest(new { error = "Failed to bulk upload items: " + ex.Message });
        }
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateItemRequest(string Name, string Sku, string? Description, string? Category, decimal Price, string? StockStatus, string? Variations, string? CustomVariables);
public sealed record UpdateItemRequest(string Name, string Sku, string? Description, string? Category, decimal Price, string? StockStatus, string? Variations, string? CustomVariables);
public sealed record DisableItemRequest(bool IsDisabled);
public sealed record BulkItemRow(string Name, string Sku, string? Description, string? Category, decimal Price, string? StockStatus, string? Variations, string? CustomVariables);
