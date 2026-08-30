using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController]
[Route("api/tenants/{tenantId}/unified-orders")]
public sealed class UnifiedOrdersController(AppDbContext dbContext) : ControllerBase
{
    public sealed record OrderItemDto(
        string Name,
        int Quantity,
        decimal UnitPrice
    );

    public sealed record CreateUnifiedOrderDto(
        string CustomerName,
        string CustomerPhone,
        string Source, // voice_ai, pos, web, manual
        string OrderType, // pickup, delivery, service_booking
        DateTimeOffset? ScheduledDate,
        string? Notes,
        List<OrderItemDto> Items
    );

    public sealed record UpdateStatusDto(
        string Status
    );

    public sealed record RescheduleOrderDto(
        DateTimeOffset ScheduledDate
    );

    public sealed record EditItemsDto(
        List<OrderItemDto> Items
    );

    [HttpGet]
    public async Task<IActionResult> GetUnifiedOrders([FromRoute] string tenantId)
    {
        // 1. Direct Unified Sales Orders
        var directOrders = await dbContext.UnifiedOrders
            .Where(o => o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var directOrderItems = await dbContext.UnifiedOrderItems
            .Where(oi => directOrders.Select(o => o.Id).Contains(oi.OrderId))
            .ToListAsync();

        // 2. Restaurant Orders
        var restaurantOrders = await dbContext.RestaurantOrders
            .Where(ro => ro.TenantId == tenantId)
            .OrderByDescending(ro => ro.CreatedAt)
            .ToListAsync();

        var rOrderIds = restaurantOrders.Select(ro => ro.OrderId).ToList();
        var rOrderItems = await dbContext.OrderItems
            .Where(oi => rOrderIds.Contains(oi.OrderId))
            .ToListAsync();

        var itemIds = rOrderItems.Select(oi => oi.ItemId).Distinct().ToList();
        var catalogItems = await dbContext.Items
            .Where(i => itemIds.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => i.Name);

        // 3. Service Appointments
        var appointments = await dbContext.Appointments
            .Where(a => a.TenantId == tenantId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var unifiedList = new List<object>();

        // Map Direct Orders
        foreach (var o in directOrders)
        {
            unifiedList.Add(new {
                o.Id,
                o.TenantId,
                Origin = "direct_sales", // direct_sales, restaurant_order, service_booking
                o.CustomerName,
                o.CustomerPhone,
                o.Source,
                o.OrderType,
                o.ScheduledDate,
                o.Status,
                o.TotalAmount,
                o.Notes,
                o.CreatedAt,
                o.UpdatedAt,
                Items = directOrderItems.Where(i => i.OrderId == o.Id).Select(i => new {
                    i.Id,
                    i.Name,
                    i.Quantity,
                    i.UnitPrice
                }).ToList()
            });
        }

        // Map Restaurant Orders
        foreach (var ro in restaurantOrders)
        {
            var lineItems = rOrderItems.Where(oi => oi.OrderId == ro.OrderId).Select(oi => new {
                oi.Id,
                Name = catalogItems.TryGetValue(oi.ItemId, out var name) ? name : "Restaurant Item",
                oi.Quantity,
                oi.UnitPrice
            }).ToList();

            // Map status
            string mappedStatus = ro.Status.ToLower() switch
            {
                "pending" => "new",
                "preparing" => "in_progress",
                "ready" => "in_progress",
                "out_for_delivery" or "delivering" => "out_for_delivery",
                "delivered" or "completed" => "completed",
                "cancelled" => "cancelled",
                _ => ro.Status.ToLower()
            };

            unifiedList.Add(new {
                Id = ro.OrderId,
                ro.TenantId,
                Origin = "restaurant_order",
                ro.CustomerName,
                ro.CustomerPhone,
                Source = "pos",
                OrderType = ro.OrderType,
                ScheduledDate = (DateTimeOffset?)null,
                Status = mappedStatus,
                ro.TotalAmount,
                Notes = ro.CustomerAddress != null ? $"Delivery Address: {ro.CustomerAddress}" : null,
                ro.CreatedAt,
                ro.UpdatedAt,
                Items = lineItems
            });
        }

        // Map Appointments
        foreach (var a in appointments)
        {
            string mappedStatus = a.Status.ToLower() switch
            {
                "booked" => "new",
                "confirmed" => "in_progress",
                "completed" => "completed",
                "cancelled" => "cancelled",
                _ => a.Status.ToLower()
            };

            unifiedList.Add(new {
                Id = a.AppointmentId,
                a.TenantId,
                Origin = "service_booking",
                a.CustomerName,
                a.CustomerPhone,
                Source = "voice_ai",
                OrderType = "service_booking",
                ScheduledDate = (DateTimeOffset?)a.StartTime,
                Status = mappedStatus,
                TotalAmount = 0m,
                Notes = a.Notes,
                a.CreatedAt,
                UpdatedAt = a.CreatedAt,
                Items = new List<object> {
                    new {
                        Id = a.AppointmentId,
                        Name = a.Service,
                        Quantity = 1,
                        UnitPrice = 0m
                    }
                }
            });
        }

        // Sort by CreatedAt descending
        var sorted = unifiedList.OrderByDescending(x => {
            var prop = x.GetType().GetProperty("CreatedAt");
            return prop != null ? (DateTimeOffset)prop.GetValue(x)! : DateTimeOffset.MinValue;
        }).ToList();

        return Ok(sorted);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromRoute] string tenantId, [FromBody] CreateUnifiedOrderDto dto)
    {
        var orderId = Guid.NewGuid().ToString();
        decimal totalAmount = 0;
        var itemsList = new List<UnifiedOrderItem>();

        foreach (var itemDto in dto.Items ?? new List<OrderItemDto>())
        {
            var linePrice = itemDto.Quantity * itemDto.UnitPrice;
            totalAmount += linePrice;

            itemsList.Add(new UnifiedOrderItem
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = orderId,
                Name = itemDto.Name,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice
            });
        }

        var order = new UnifiedOrder
        {
            Id = orderId,
            TenantId = tenantId,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            Source = string.IsNullOrWhiteSpace(dto.Source) ? "manual" : dto.Source.ToLower(),
            OrderType = string.IsNullOrWhiteSpace(dto.OrderType) ? "pickup" : dto.OrderType.ToLower(),
            ScheduledDate = dto.ScheduledDate ?? DateTimeOffset.UtcNow.AddHours(2),
            Status = "new",
            TotalAmount = totalAmount,
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.UnifiedOrders.Add(order);
        dbContext.UnifiedOrderItems.AddRange(itemsList);
        await dbContext.SaveChangesAsync();

        return Ok(new {
            order.Id,
            order.TenantId,
            Origin = "direct_sales",
            order.CustomerName,
            order.CustomerPhone,
            order.Source,
            order.OrderType,
            order.ScheduledDate,
            order.Status,
            order.TotalAmount,
            order.Notes,
            order.CreatedAt,
            Items = itemsList
        });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus([FromRoute] string tenantId, [FromRoute] string id, [FromBody] UpdateStatusDto dto)
    {
        var targetStatus = dto.Status.ToLower();

        // Check direct order
        var order = await dbContext.UnifiedOrders.FirstOrDefaultAsync(o => o.TenantId == tenantId && o.Id == id);
        if (order != null)
        {
            order.Status = targetStatus;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync();
            return Ok(new { order.Id, order.Status });
        }

        // Check restaurant order
        var rOrder = await dbContext.RestaurantOrders.FirstOrDefaultAsync(ro => ro.TenantId == tenantId && ro.OrderId == id);
        if (rOrder != null)
        {
            rOrder.Status = targetStatus switch
            {
                "new" => "pending",
                "in_progress" => "preparing",
                "out_for_delivery" => "delivering",
                "completed" => "delivered",
                "cancelled" => "cancelled",
                _ => targetStatus
            };
            rOrder.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync();
            return Ok(new { Id = rOrder.OrderId, Status = targetStatus });
        }

        // Check appointment
        var appt = await dbContext.Appointments.FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AppointmentId == id);
        if (appt != null)
        {
            appt.Status = targetStatus switch
            {
                "new" => "booked",
                "in_progress" => "confirmed",
                "completed" => "completed",
                "cancelled" => "cancelled",
                _ => targetStatus
            };
            await dbContext.SaveChangesAsync();
            return Ok(new { Id = appt.AppointmentId, Status = targetStatus });
        }

        return NotFound("Order not found.");
    }

    [HttpPut("{id}/reschedule")]
    public async Task<IActionResult> RescheduleOrder([FromRoute] string tenantId, [FromRoute] string id, [FromBody] RescheduleOrderDto dto)
    {
        var order = await dbContext.UnifiedOrders.FirstOrDefaultAsync(o => o.TenantId == tenantId && o.Id == id);
        if (order != null)
        {
            order.ScheduledDate = dto.ScheduledDate;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync();
            return Ok(order);
        }

        var appt = await dbContext.Appointments.FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AppointmentId == id);
        if (appt != null)
        {
            appt.StartTime = dto.ScheduledDate;
            appt.EndTime = dto.ScheduledDate.AddMinutes(30);
            await dbContext.SaveChangesAsync();
            return Ok(new { Id = appt.AppointmentId, ScheduledDate = appt.StartTime });
        }

        return NotFound("Order not found for rescheduling.");
    }

    [HttpPut("{id}/items")]
    public async Task<IActionResult> EditItems([FromRoute] string tenantId, [FromRoute] string id, [FromBody] EditItemsDto dto)
    {
        var order = await dbContext.UnifiedOrders.FirstOrDefaultAsync(o => o.TenantId == tenantId && o.Id == id);
        if (order == null) return NotFound("Only direct sales orders support inline item modification.");

        var existingItems = await dbContext.UnifiedOrderItems.Where(i => i.OrderId == id).ToListAsync();
        dbContext.UnifiedOrderItems.RemoveRange(existingItems);

        decimal total = 0;
        var newItems = new List<UnifiedOrderItem>();
        foreach (var itemDto in dto.Items ?? new List<OrderItemDto>())
        {
            total += itemDto.Quantity * itemDto.UnitPrice;
            newItems.Add(new UnifiedOrderItem
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = id,
                Name = itemDto.Name,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice
            });
        }

        order.TotalAmount = total;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.UnifiedOrderItems.AddRange(newItems);
        await dbContext.SaveChangesAsync();

        return Ok(new { order, items = newItems });
    }
}
