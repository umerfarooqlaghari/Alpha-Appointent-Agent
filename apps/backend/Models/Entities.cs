namespace Alpha.Appointment.Api.Models;
public sealed class Tenant { public string TenantId { get; set; } = ""; public string Name { get; set; } = ""; public string Status { get; set; } = "active"; public DateTimeOffset CreatedAt { get; set; } }
public sealed class TenantConfig { public string TenantId { get; set; } = ""; public string AdapterType { get; set; } = "postgres"; public string? IndustryType { get; set; } public string Currency { get; set; } = "USD"; public string? ApiBaseUrl { get; set; } public string? AuthHeaderName { get; set; } public string? AuthToken { get; set; } public string? ProductsApiUrl { get; set; } public string InventorySource { get; set; } = "database"; public string? PublishableKey { get; set; } public string? AllowedDomains { get; set; } public string DisabledTabs { get; set; } = ""; }
public sealed class Item { public string Id { get; set; } = ""; public string TenantId { get; set; } = ""; public string Name { get; set; } = ""; public string Sku { get; set; } = ""; public string? Description { get; set; } public string? Category { get; set; } public decimal Price { get; set; } public string StockStatus { get; set; } = "in_stock"; public string Variations { get; set; } = "[]"; public string CustomVariables { get; set; } = "{}"; public bool IsDisabled { get; set; } = false; public DateTimeOffset CreatedAt { get; set; } public DateTimeOffset UpdatedAt { get; set; } }
public sealed class AvailabilitySlot { public string SlotId { get; set; } = ""; public string TenantId { get; set; } = ""; public DateTimeOffset SlotStart { get; set; } public DateTimeOffset SlotEnd { get; set; } public bool IsBooked { get; set; } public string? AppointmentId { get; set; } }
public sealed class TenantAvailabilitySettings { public string TenantId { get; set; } = ""; public string TimeZone { get; set; } = "UTC"; public int SlotDurationMinutes { get; set; } = 30; }
public sealed class TenantWorkingHours { public string TenantId { get; set; } = ""; public int DayOfWeek { get; set; } public TimeOnly StartTime { get; set; } public TimeOnly EndTime { get; set; } }
public sealed class TenantHoliday { public string HolidayId { get; set; } = ""; public string TenantId { get; set; } = ""; public DateOnly HolidayDate { get; set; } public string? Name { get; set; } }
public sealed class TenantSlotExclusion { public string TenantId { get; set; } = ""; public DateTimeOffset SlotStart { get; set; } }
public sealed class Appointment { public string AppointmentId { get; set; } = ""; public string TenantId { get; set; } = ""; public string CustomerName { get; set; } = ""; public string CustomerPhone { get; set; } = ""; public string Service { get; set; } = ""; public DateTimeOffset StartTime { get; set; } public DateTimeOffset EndTime { get; set; } public string Status { get; set; } = "booked"; public string? Notes { get; set; } public DateTimeOffset CreatedAt { get; set; } }
public sealed class User { public long Id { get; set; } public string? TenantId { get; set; } public string Name { get; set; } = ""; public string? Phone { get; set; } public string Email { get; set; } = ""; public string? PasswordHash { get; set; } public string Role { get; set; } = "tenant_user"; public bool IsActive { get; set; } = true; public DateTimeOffset CreatedAt { get; set; } public DateTimeOffset UpdatedAt { get; set; } }
public sealed class RefreshToken { public string TokenHash { get; set; } = ""; public long UserId { get; set; } public DateTimeOffset ExpiresAt { get; set; } public DateTimeOffset CreatedAt { get; set; } public DateTimeOffset? RevokedAt { get; set; } }
public sealed class Faq { public string Id { get; set; } = ""; public string TenantId { get; set; } = ""; public string Question { get; set; } = ""; public string Answer { get; set; } = ""; public DateTimeOffset CreatedAt { get; set; } public DateTimeOffset UpdatedAt { get; set; } }
public sealed class TenantSubscription { public string Id { get; set; } = ""; public string TenantId { get; set; } = ""; public string PlanName { get; set; } = "Starter"; public int MonthlyMinutesLimit { get; set; } = 500; public double MinutesUsed { get; set; } = 0.0; public DateTimeOffset CurrentPeriodStart { get; set; } public DateTimeOffset CurrentPeriodEnd { get; set; } public bool IsActive { get; set; } = true; }
public sealed class SubscriptionPlan { public string Id { get; set; } = ""; public string PlanName { get; set; } = ""; public int MonthlyMinutesLimit { get; set; } = 500; public decimal Price { get; set; } = 50.00m; public string Description { get; set; } = ""; public bool IsActive { get; set; } = true; public DateTimeOffset CreatedAt { get; set; } }

public sealed class RestaurantOrder
{
    public string OrderId { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string? CustomerAddress { get; set; }
    public string OrderType { get; set; } = "pickup"; // pickup, delivery
    public decimal TotalAmount { get; set; } = 0;
    public string Status { get; set; } = "pending"; // pending, preparing, ready, delivered, cancelled
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class OrderItem
{
    public string Id { get; set; } = "";
    public string OrderId { get; set; } = "";
    public string ItemId { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
}

public sealed class Category
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Name { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ServiceItem
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? DurationMinutes { get; set; }
    public string Category { get; set; } = "General";
    public bool IsDisabled { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class CallLog
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string? CustomerPhone { get; set; }
    public int DurationSeconds { get; set; } = 0;
    public string? Transcript { get; set; }
    public string? Summary { get; set; }
    public string? RecordingUrl { get; set; }
    public decimal Cost { get; set; } = 0;
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public string CallType { get; set; } = "inbound";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}