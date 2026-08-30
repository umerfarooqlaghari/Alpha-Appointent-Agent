using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/categories")]
[Authorize]
public sealed class CategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetCategories(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var categories = await db.Categories
            .Where(c => c.TenantId == tenantId)
            .OrderBy(c => c.Name)
            .ToListAsync();
        return Results.Ok(categories);
    }

    [HttpPost]
    public async Task<IResult> CreateCategory(string tenantId, CreateCategoryRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.BadRequest(new { error = "Category name is required." });

        var exists = await db.Categories.AnyAsync(c => c.TenantId == tenantId && c.Name.ToLower() == request.Name.ToLower());
        if (exists) return Results.Conflict(new { error = "Category already exists." });

        var category = new Category
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Name = request.Name,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/categories/{category.Id}", category);
    }

    [HttpPut("{categoryId}")]
    public async Task<IResult> UpdateCategory(string tenantId, string categoryId, UpdateCategoryRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.BadRequest(new { error = "Category name is required." });

        var category = await db.Categories.SingleOrDefaultAsync(c => c.TenantId == tenantId && c.Id == categoryId);
        if (category is null) return Results.NotFound();

        var oldName = category.Name;
        var newName = request.Name.Trim();

        var exists = await db.Categories.AnyAsync(c => c.TenantId == tenantId && c.Id != categoryId && c.Name.ToLower() == newName.ToLower());
        if (exists) return Results.Conflict(new { error = "Category with this name already exists." });

        category.Name = newName;

        // Cascade category name update to existing items
        if (!string.Equals(oldName, newName, StringComparison.OrdinalIgnoreCase))
        {
            var itemsToUpdate = await db.Items.Where(i => i.TenantId == tenantId && i.Category == oldName).ToListAsync();
            foreach (var item in itemsToUpdate)
            {
                item.Category = newName;
                item.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await db.SaveChangesAsync();
        return Results.Ok(category);
    }

    [HttpDelete("{categoryId}")]
    public async Task<IResult> DeleteCategory(string tenantId, string categoryId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        
        var category = await db.Categories.SingleOrDefaultAsync(c => c.TenantId == tenantId && c.Id == categoryId);
        if (category is null) return Results.NotFound();

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        
        return Results.NoContent();
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateCategoryRequest(string Name);
public sealed record UpdateCategoryRequest(string Name);
