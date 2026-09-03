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
    public string? Identifier { get; set; }
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

public sealed class Lead
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string? CallLogIdentifier { get; set; }
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string? Email { get; set; }
    public string Stage { get; set; } = "new"; // new, qualified, proposal, won, lost
    public int Score { get; set; } = 50;
    public string? AssignedTo { get; set; }
    public string? Summary { get; set; }
    public string Source { get; set; } = "manual"; // voice_call, web_form, manual
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class LeadTask
{
    public string Id { get; set; } = "";
    public string LeadId { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Title { get; set; } = "";
    public DateTimeOffset? DueDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public string? AssignedTo { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Quote
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string? LeadId { get; set; }
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public string Status { get; set; } = "draft"; // draft, sent, approved, rejected, converted
    public decimal Subtotal { get; set; } = 0;
    public decimal TaxRate { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;
    public string? DigitalSignature { get; set; }
    public DateTimeOffset? SignedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class QuoteItem
{
    public string Id { get; set; } = "";
    public string QuoteId { get; set; } = "";
    public string ItemName { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal TotalPrice { get; set; } = 0;
}

public sealed class UnifiedOrder
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string Source { get; set; } = "manual"; // voice_ai, pos, web, manual
    public string OrderType { get; set; } = "pickup"; // pickup, delivery, service_booking
    public DateTimeOffset? ScheduledDate { get; set; }
    public string Status { get; set; } = "new"; // new, in_progress, out_for_delivery, completed, cancelled
    public decimal TotalAmount { get; set; } = 0;
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class UnifiedOrderItem
{
    public string Id { get; set; } = "";
    public string OrderId { get; set; } = "";
    public string Name { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
}

public sealed class Invoice
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string InvoiceNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public string? OrderId { get; set; }
    public string? QuoteId { get; set; }
    public string? LeadId { get; set; }
    public string InvoiceType { get; set; } = "one_time"; // one_time, recurring_monthly, recurring_yearly
    public decimal Subtotal { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;
    public decimal DepositRequired { get; set; } = 0;
    public decimal AmountPaid { get; set; } = 0;
    public string Status { get; set; } = "unpaid"; // unpaid, partially_paid, paid, overdue, bad_debt, cancelled
    public DateTimeOffset DueDate { get; set; }
    public string? PaymentLink { get; set; }
    public string PaymentGateway { get; set; } = "stripe";
    public DateTimeOffset? LastReminderSentAt { get; set; }
    public string DunningStatus { get; set; } = "pending"; // pending, reminded_pre_due, reminded_overdue, escalated, written_off
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class InvoiceItem
{
    public string Id { get; set; } = "";
    public string InvoiceId { get; set; } = "";
    public string ItemName { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal TotalPrice { get; set; } = 0;
}

public sealed class InvoicePayment
{
    public string Id { get; set; } = "";
    public string InvoiceId { get; set; } = "";
    public string TenantId { get; set; } = "";
    public decimal Amount { get; set; } = 0;
    public string PaymentMethod { get; set; } = "card"; // card, cash, bank_transfer, local_gateway
    public string? TransactionReference { get; set; }
    public string? ReceiptUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Expense
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Category { get; set; } = "supplies"; // supplies, utilities, payroll, cogs_materials, marketing, rent, other
    public decimal Amount { get; set; } = 0;
    public string? VendorName { get; set; }
    public string? AssociatedItemId { get; set; }
    public string? ReceiptUrl { get; set; }
    public DateTimeOffset ExpenseDate { get; set; } = DateTimeOffset.UtcNow;
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ItemCogs
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string ItemId { get; set; } = "";
    public string ItemType { get; set; } = "item"; // item, service
    public decimal UnitCogs { get; set; } = 0;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ServiceFulfillment
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string ReferenceType { get; set; } = "manual"; // appointment, order, quote, manual
    public string? ReferenceId { get; set; }
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public string ServiceTitle { get; set; } = "";
    public DateTimeOffset ScheduledAt { get; set; } = DateTimeOffset.UtcNow;
    public string Priority { get; set; } = "normal"; // normal, urgent, vip
    public string Status { get; set; } = "queued"; // queued, confirmed, in_progress, completed, cancelled
    public string? AssignedStaffId { get; set; }
    public string? AssignedStaffName { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class StaffRole
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string RoleName { get; set; } = "";
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class StaffMember
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = "technician"; // technician, dispatcher, driver, support, manager
    public string? Skills { get; set; }
    public string Status { get; set; } = "active"; // active, inactive, on_leave
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class StaffShift
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string StaffName { get; set; } = "";
    public string? StaffEmail { get; set; }
    public string Role { get; set; } = "technician"; // technician, dispatcher, driver, support, manager
    public DateOnly ShiftDate { get; set; }
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "17:00";
    public string Status { get; set; } = "scheduled"; // scheduled, active, completed, off
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class DispatchTask
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? FulfillmentId { get; set; }
    public string AssignedToName { get; set; } = "";
    public string? AssignedToEmail { get; set; }
    public string Priority { get; set; } = "medium"; // low, medium, high, critical
    public string Status { get; set; } = "pending"; // pending, in_progress, completed, blocked
    public DateTimeOffset DueDate { get; set; } = DateTimeOffset.UtcNow.AddDays(1);
    public string? CheckInNotes { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class EmailLogAlert
{
    public string Id { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string EmailType { get; set; } = "transactional_confirmation"; // transactional_confirmation, post_call_summary, financial_digest_daily, financial_digest_monthly, escalation_alert
    public string RecipientEmail { get; set; } = "";
    public string RecipientName { get; set; } = "";
    public string Subject { get; set; } = "";
    public string BodyPreview { get; set; } = "";
    public string Status { get; set; } = "sent"; // sent, delivered, failed, queued
    public string TriggeredBy { get; set; } = "system"; // ai_receptionist, system_cron, admin_dispatch
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}