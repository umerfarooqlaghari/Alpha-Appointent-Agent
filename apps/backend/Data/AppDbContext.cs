using Alpha.Appointment.Api.Models;
using Microsoft.EntityFrameworkCore;
using AppointmentEntity = Alpha.Appointment.Api.Models.Appointment;

namespace Alpha.Appointment.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>(); public DbSet<TenantConfig> TenantConfigs => Set<TenantConfig>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>(); public DbSet<AppointmentEntity> Appointments => Set<AppointmentEntity>(); public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<TenantAvailabilitySettings> TenantAvailabilitySettings => Set<TenantAvailabilitySettings>(); public DbSet<TenantWorkingHours> TenantWorkingHours => Set<TenantWorkingHours>(); public DbSet<TenantHoliday> TenantHolidays => Set<TenantHoliday>();
    public DbSet<TenantSlotExclusion> TenantSlotExclusions => Set<TenantSlotExclusion>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<RestaurantOrder> RestaurantOrders => Set<RestaurantOrder>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ServiceItem> Services => Set<ServiceItem>();
    public DbSet<CallLog> CallLogs => Set<CallLog>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadTask> LeadTasks => Set<LeadTask>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<QuoteItem> QuoteItems => Set<QuoteItem>();
    public DbSet<UnifiedOrder> UnifiedOrders => Set<UnifiedOrder>();
    public DbSet<UnifiedOrderItem> UnifiedOrderItems => Set<UnifiedOrderItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<InvoicePayment> InvoicePayments => Set<InvoicePayment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ItemCogs> ItemCogs => Set<ItemCogs>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(entity => { entity.ToTable("tenants"); entity.HasKey(item => item.TenantId); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Name).HasColumnName("name"); entity.Property(item => item.Status).HasColumnName("status"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); });
        modelBuilder.Entity<TenantConfig>(entity => { entity.ToTable("tenant_configs"); entity.HasKey(item => item.TenantId); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.AdapterType).HasColumnName("adapter_type"); entity.Property(item => item.IndustryType).HasColumnName("industry_type"); entity.Property(item => item.Currency).HasColumnName("currency"); entity.Property(item => item.ApiBaseUrl).HasColumnName("api_base_url"); entity.Property(item => item.AuthHeaderName).HasColumnName("auth_header_name"); entity.Property(item => item.AuthToken).HasColumnName("auth_token"); entity.Property(item => item.ProductsApiUrl).HasColumnName("products_api_url"); entity.Property(item => item.InventorySource).HasColumnName("inventory_source"); entity.Property(item => item.PublishableKey).HasColumnName("publishable_key"); entity.Property(item => item.AllowedDomains).HasColumnName("allowed_domains"); entity.Property(item => item.DisabledTabs).HasColumnName("disabled_tabs"); });
        modelBuilder.Entity<AvailabilitySlot>(entity => { entity.ToTable("availability_slots"); entity.HasKey(item => item.SlotId); entity.Property(item => item.SlotId).HasColumnName("slot_id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.SlotStart).HasColumnName("slot_start"); entity.Property(item => item.SlotEnd).HasColumnName("slot_end"); entity.Property(item => item.IsBooked).HasColumnName("is_booked"); entity.Property(item => item.AppointmentId).HasColumnName("appointment_id"); });
        modelBuilder.Entity<TenantAvailabilitySettings>(entity => { entity.ToTable("tenant_availability_settings"); entity.HasKey(item => item.TenantId); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.TimeZone).HasColumnName("time_zone"); entity.Property(item => item.SlotDurationMinutes).HasColumnName("slot_duration_minutes"); });
        modelBuilder.Entity<TenantWorkingHours>(entity => { entity.ToTable("tenant_working_hours"); entity.HasKey(item => new { item.TenantId, item.DayOfWeek }); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.DayOfWeek).HasColumnName("day_of_week"); entity.Property(item => item.StartTime).HasColumnName("start_time"); entity.Property(item => item.EndTime).HasColumnName("end_time"); });
        modelBuilder.Entity<TenantHoliday>(entity => { entity.ToTable("tenant_holidays"); entity.HasKey(item => item.HolidayId); entity.Property(item => item.HolidayId).HasColumnName("holiday_id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.HolidayDate).HasColumnName("holiday_date"); entity.Property(item => item.Name).HasColumnName("name"); });
        modelBuilder.Entity<TenantSlotExclusion>(entity => { entity.ToTable("tenant_slot_exclusions"); entity.HasKey(item => new { item.TenantId, item.SlotStart }); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.SlotStart).HasColumnName("slot_start"); });
        modelBuilder.Entity<AppointmentEntity>(entity => { entity.ToTable("appointments"); entity.HasKey(item => item.AppointmentId); entity.Property(item => item.AppointmentId).HasColumnName("appointment_id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.CustomerName).HasColumnName("customer_name"); entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone"); entity.Property(item => item.Service).HasColumnName("service"); entity.Property(item => item.StartTime).HasColumnName("start_time"); entity.Property(item => item.EndTime).HasColumnName("end_time"); entity.Property(item => item.Status).HasColumnName("status"); entity.Property(item => item.Notes).HasColumnName("notes"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); });
        modelBuilder.Entity<User>(entity => { entity.ToTable("users"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Name).HasColumnName("name"); entity.Property(item => item.Email).HasColumnName("email"); entity.Property(item => item.Phone).HasColumnName("phone"); entity.Property(item => item.PasswordHash).HasColumnName("password_hash"); entity.Property(item => item.Role).HasColumnName("role"); entity.Property(item => item.IsActive).HasColumnName("is_active"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.UpdatedAt).HasColumnName("updated_at"); });
        modelBuilder.Entity<RefreshToken>(entity => { entity.ToTable("refresh_tokens"); entity.HasKey(item => item.TokenHash); entity.Property(item => item.TokenHash).HasColumnName("token_hash"); entity.Property(item => item.UserId).HasColumnName("user_id"); entity.Property(item => item.ExpiresAt).HasColumnName("expires_at"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.RevokedAt).HasColumnName("revoked_at"); });
        modelBuilder.Entity<Item>(entity => { entity.ToTable("items"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Name).HasColumnName("name"); entity.Property(item => item.Sku).HasColumnName("sku"); entity.Property(item => item.Description).HasColumnName("description"); entity.Property(item => item.Category).HasColumnName("category"); entity.Property(item => item.Price).HasColumnName("price"); entity.Property(item => item.StockStatus).HasColumnName("stock_status"); entity.Property(item => item.Variations).HasColumnName("variations").HasColumnType("jsonb"); entity.Property(item => item.CustomVariables).HasColumnName("custom_variables").HasColumnType("jsonb"); entity.Property(item => item.IsDisabled).HasColumnName("is_disabled"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.UpdatedAt).HasColumnName("updated_at"); });
        modelBuilder.Entity<Faq>(entity => { entity.ToTable("faqs"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Question).HasColumnName("question"); entity.Property(item => item.Answer).HasColumnName("answer"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.UpdatedAt).HasColumnName("updated_at"); });
        modelBuilder.Entity<TenantSubscription>(entity => { entity.ToTable("tenant_subscriptions"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.PlanName).HasColumnName("plan_name"); entity.Property(item => item.MonthlyMinutesLimit).HasColumnName("monthly_minutes_limit"); entity.Property(item => item.MinutesUsed).HasColumnName("minutes_used"); entity.Property(item => item.CurrentPeriodStart).HasColumnName("current_period_start"); entity.Property(item => item.CurrentPeriodEnd).HasColumnName("current_period_end"); entity.Property(item => item.IsActive).HasColumnName("is_active"); });
        modelBuilder.Entity<SubscriptionPlan>(entity => { entity.ToTable("subscription_plans"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.PlanName).HasColumnName("plan_name"); entity.Property(item => item.MonthlyMinutesLimit).HasColumnName("monthly_minutes_limit"); entity.Property(item => item.Price).HasColumnName("price"); entity.Property(item => item.Description).HasColumnName("description"); entity.Property(item => item.IsActive).HasColumnName("is_active"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); });
        modelBuilder.Entity<RestaurantOrder>(entity => { entity.ToTable("restaurant_orders"); entity.HasKey(item => item.OrderId); entity.Property(item => item.OrderId).HasColumnName("order_id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.CustomerName).HasColumnName("customer_name"); entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone"); entity.Property(item => item.CustomerAddress).HasColumnName("customer_address"); entity.Property(item => item.OrderType).HasColumnName("order_type"); entity.Property(item => item.TotalAmount).HasColumnName("total_amount"); entity.Property(item => item.Status).HasColumnName("status"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.UpdatedAt).HasColumnName("updated_at"); });
        modelBuilder.Entity<OrderItem>(entity => { entity.ToTable("order_items"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.OrderId).HasColumnName("order_id"); entity.Property(item => item.ItemId).HasColumnName("item_id"); entity.Property(item => item.Quantity).HasColumnName("quantity"); entity.Property(item => item.UnitPrice).HasColumnName("unit_price"); });
        modelBuilder.Entity<Category>(entity => { entity.ToTable("categories"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Name).HasColumnName("name"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); });
        modelBuilder.Entity<ServiceItem>(entity => { entity.ToTable("service_items"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Name).HasColumnName("name"); entity.Property(item => item.Description).HasColumnName("description"); entity.Property(item => item.Price).HasColumnName("price"); entity.Property(item => item.DurationMinutes).HasColumnName("duration_minutes"); entity.Property(item => item.Category).HasColumnName("category"); entity.Property(item => item.IsDisabled).HasColumnName("is_disabled"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); entity.Property(item => item.UpdatedAt).HasColumnName("updated_at"); });
        modelBuilder.Entity<CallLog>(entity => { entity.ToTable("call_logs"); entity.HasKey(item => item.Id); entity.Property(item => item.Id).HasColumnName("id"); entity.Property(item => item.TenantId).HasColumnName("tenant_id"); entity.Property(item => item.Identifier).HasColumnName("identifier"); entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone"); entity.Property(item => item.DurationSeconds).HasColumnName("duration_seconds"); entity.Property(item => item.Transcript).HasColumnName("transcript"); entity.Property(item => item.Summary).HasColumnName("summary"); entity.Property(item => item.RecordingUrl).HasColumnName("recording_url"); entity.Property(item => item.Cost).HasColumnName("cost"); entity.Property(item => item.StartedAt).HasColumnName("started_at"); entity.Property(item => item.EndedAt).HasColumnName("ended_at"); entity.Property(item => item.CallType).HasColumnName("call_type"); entity.Property(item => item.CreatedAt).HasColumnName("created_at"); });

        modelBuilder.Entity<Lead>(entity => {
            entity.ToTable("leads");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.CallLogIdentifier).HasColumnName("call_log_identifier");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Phone).HasColumnName("phone");
            entity.Property(item => item.Email).HasColumnName("email");
            entity.Property(item => item.Stage).HasColumnName("stage");
            entity.Property(item => item.Score).HasColumnName("score");
            entity.Property(item => item.AssignedTo).HasColumnName("assigned_to");
            entity.Property(item => item.Summary).HasColumnName("summary");
            entity.Property(item => item.Source).HasColumnName("source");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<LeadTask>(entity => {
            entity.ToTable("lead_tasks");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.LeadId).HasColumnName("lead_id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.Title).HasColumnName("title");
            entity.Property(item => item.DueDate).HasColumnName("due_date");
            entity.Property(item => item.IsCompleted).HasColumnName("is_completed");
            entity.Property(item => item.AssignedTo).HasColumnName("assigned_to");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Quote>(entity => {
            entity.ToTable("quotes");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.LeadId).HasColumnName("lead_id");
            entity.Property(item => item.CustomerName).HasColumnName("customer_name");
            entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone");
            entity.Property(item => item.CustomerEmail).HasColumnName("customer_email");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.Subtotal).HasColumnName("subtotal");
            entity.Property(item => item.TaxRate).HasColumnName("tax_rate");
            entity.Property(item => item.TaxAmount).HasColumnName("tax_amount");
            entity.Property(item => item.DiscountAmount).HasColumnName("discount_amount");
            entity.Property(item => item.TotalAmount).HasColumnName("total_amount");
            entity.Property(item => item.DigitalSignature).HasColumnName("digital_signature");
            entity.Property(item => item.SignedAt).HasColumnName("signed_at");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<QuoteItem>(entity => {
            entity.ToTable("quote_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.QuoteId).HasColumnName("quote_id");
            entity.Property(item => item.ItemName).HasColumnName("item_name");
            entity.Property(item => item.Quantity).HasColumnName("quantity");
            entity.Property(item => item.UnitPrice).HasColumnName("unit_price");
            entity.Property(item => item.TotalPrice).HasColumnName("total_price");
        });

        modelBuilder.Entity<UnifiedOrder>(entity => {
            entity.ToTable("unified_orders");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.CustomerName).HasColumnName("customer_name");
            entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone");
            entity.Property(item => item.Source).HasColumnName("source");
            entity.Property(item => item.OrderType).HasColumnName("order_type");
            entity.Property(item => item.ScheduledDate).HasColumnName("scheduled_date");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.TotalAmount).HasColumnName("total_amount");
            entity.Property(item => item.Notes).HasColumnName("notes");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<UnifiedOrderItem>(entity => {
            entity.ToTable("unified_order_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.OrderId).HasColumnName("order_id");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Quantity).HasColumnName("quantity");
            entity.Property(item => item.UnitPrice).HasColumnName("unit_price");
        });

        modelBuilder.Entity<Invoice>(entity => {
            entity.ToTable("invoices");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.InvoiceNumber).HasColumnName("invoice_number");
            entity.Property(item => item.CustomerName).HasColumnName("customer_name");
            entity.Property(item => item.CustomerPhone).HasColumnName("customer_phone");
            entity.Property(item => item.CustomerEmail).HasColumnName("customer_email");
            entity.Property(item => item.OrderId).HasColumnName("order_id");
            entity.Property(item => item.QuoteId).HasColumnName("quote_id");
            entity.Property(item => item.LeadId).HasColumnName("lead_id");
            entity.Property(item => item.InvoiceType).HasColumnName("invoice_type");
            entity.Property(item => item.Subtotal).HasColumnName("subtotal");
            entity.Property(item => item.TaxAmount).HasColumnName("tax_amount");
            entity.Property(item => item.DiscountAmount).HasColumnName("discount_amount");
            entity.Property(item => item.TotalAmount).HasColumnName("total_amount");
            entity.Property(item => item.DepositRequired).HasColumnName("deposit_required");
            entity.Property(item => item.AmountPaid).HasColumnName("amount_paid");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.DueDate).HasColumnName("due_date");
            entity.Property(item => item.PaymentLink).HasColumnName("payment_link");
            entity.Property(item => item.PaymentGateway).HasColumnName("payment_gateway");
            entity.Property(item => item.LastReminderSentAt).HasColumnName("last_reminder_sent_at");
            entity.Property(item => item.DunningStatus).HasColumnName("dunning_status");
            entity.Property(item => item.Notes).HasColumnName("notes");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<InvoiceItem>(entity => {
            entity.ToTable("invoice_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.InvoiceId).HasColumnName("invoice_id");
            entity.Property(item => item.ItemName).HasColumnName("item_name");
            entity.Property(item => item.Quantity).HasColumnName("quantity");
            entity.Property(item => item.UnitPrice).HasColumnName("unit_price");
            entity.Property(item => item.TotalPrice).HasColumnName("total_price");
        });

        modelBuilder.Entity<InvoicePayment>(entity => {
            entity.ToTable("invoice_payments");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.InvoiceId).HasColumnName("invoice_id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.Amount).HasColumnName("amount");
            entity.Property(item => item.PaymentMethod).HasColumnName("payment_method");
            entity.Property(item => item.TransactionReference).HasColumnName("transaction_reference");
            entity.Property(item => item.ReceiptUrl).HasColumnName("receipt_url");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Expense>(entity => {
            entity.ToTable("expenses");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.Title).HasColumnName("title");
            entity.Property(item => item.Category).HasColumnName("category");
            entity.Property(item => item.Amount).HasColumnName("amount");
            entity.Property(item => item.VendorName).HasColumnName("vendor_name");
            entity.Property(item => item.AssociatedItemId).HasColumnName("associated_item_id");
            entity.Property(item => item.ReceiptUrl).HasColumnName("receipt_url");
            entity.Property(item => item.ExpenseDate).HasColumnName("expense_date");
            entity.Property(item => item.Notes).HasColumnName("notes");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<ItemCogs>(entity => {
            entity.ToTable("item_cogs");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.TenantId).HasColumnName("tenant_id");
            entity.Property(item => item.ItemId).HasColumnName("item_id");
            entity.Property(item => item.ItemType).HasColumnName("item_type");
            entity.Property(item => item.UnitCogs).HasColumnName("unit_cogs");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at");
        });
    }
}