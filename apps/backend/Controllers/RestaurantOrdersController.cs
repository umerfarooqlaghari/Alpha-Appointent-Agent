using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/orders")]
[Authorize]
public sealed class RestaurantOrdersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetOrders(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var orders = await db.RestaurantOrders
            .Where(o => o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Results.Ok(orders);
    }

    [HttpGet("{orderId}")]
    public async Task<IResult> GetOrderDetails(string tenantId, string orderId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var order = await db.RestaurantOrders
            .SingleOrDefaultAsync(o => o.TenantId == tenantId && o.OrderId == orderId);
        
        if (order is null) return Results.NotFound();

        var orderItems = await db.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .ToListAsync();

        return Results.Ok(new { Order = order, Items = orderItems });
    }

    [HttpPost]
    public async Task<IResult> CreateOrder(string tenantId, CreateRestaurantOrderRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        
        var newOrder = new RestaurantOrder
        {
            OrderId = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            CustomerName = request.CustomerName ?? "",
            CustomerPhone = request.CustomerPhone ?? "",
            CustomerAddress = request.CustomerAddress,
            OrderType = request.OrderType ?? "pickup",
            TotalAmount = request.TotalAmount,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.RestaurantOrders.Add(newOrder);

        if (request.Items != null && request.Items.Any())
        {
            var orderItems = request.Items.Select(item => new OrderItem
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = newOrder.OrderId,
                ItemId = item.ItemId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
            db.OrderItems.AddRange(orderItems);
        }

        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/orders/{newOrder.OrderId}", newOrder);
    }

    [HttpPut("{orderId}/status")]
    public async Task<IResult> UpdateOrderStatus(string tenantId, string orderId, UpdateOrderStatusRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        
        var order = await db.RestaurantOrders.SingleOrDefaultAsync(o => o.TenantId == tenantId && o.OrderId == orderId);
        if (order is null) return Results.NotFound();

        order.Status = request.Status;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(order);
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateRestaurantOrderRequest(string? CustomerName, string? CustomerPhone, string? CustomerAddress, string? OrderType, decimal TotalAmount, List<CreateOrderItemRequest>? Items);
public sealed record CreateOrderItemRequest(string ItemId, int Quantity, decimal UnitPrice);
public sealed record UpdateOrderStatusRequest(string Status);
