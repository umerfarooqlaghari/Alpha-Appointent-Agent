using System.Text;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Alpha.Appointment.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Postgres") ?? builder.Configuration.GetConnectionString("DefaultConnection") ?? builder.Configuration["DATABASE_URL"]
    ?? throw new InvalidOperationException("DATABASE_URL or ConnectionStrings__Postgres is required.");
if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    var uri = new Uri(connectionString);
    var credentials = uri.UserInfo.Split(':', 2);
    var port = uri.IsDefaultPort ? 5432 : uri.Port;
    connectionString = $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={Uri.UnescapeDataString(credentials[0])};Password={Uri.UnescapeDataString(credentials[1])};SSL Mode=Require;Trust Server Certificate=true";
}
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET is required.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<AvailabilityScheduleService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Description = "Enter a JWT bearer token." });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
});
builder.Services.AddCors(options => options.AddPolicy("frontends", policy => policy
    .WithOrigins("http://localhost:3000", "http://localhost:3001")
    .AllowAnyHeader()
    .AllowAnyMethod()));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = "alpha-appointment-api",
        ValidateAudience = true, ValidAudience = "alpha-appointment-frontends",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1),
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS tenant_availability_settings (
            tenant_id TEXT PRIMARY KEY,
            time_zone TEXT NOT NULL DEFAULT 'UTC',
            slot_duration_minutes INTEGER NOT NULL DEFAULT 30
        );
        CREATE TABLE IF NOT EXISTS tenant_working_hours (
            tenant_id TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            PRIMARY KEY (tenant_id, day_of_week)
        );
        CREATE TABLE IF NOT EXISTS tenant_holidays (
            holiday_id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            holiday_date DATE NOT NULL,
            name TEXT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tenant_holidays_tenant_date ON tenant_holidays (tenant_id, holiday_date);
        CREATE TABLE IF NOT EXISTS tenant_slot_exclusions (
            tenant_id TEXT NOT NULL,
            slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY (tenant_id, slot_start)
        );
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            token_hash TEXT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            revoked_at TIMESTAMP WITH TIME ZONE NULL
        );
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            sku TEXT NOT NULL,
            description TEXT,
            category TEXT,
            price NUMERIC(12, 2) NOT NULL,
            stock_status TEXT NOT NULL,
            variations JSONB DEFAULT '[]'::jsonb,
            custom_variables JSONB DEFAULT '{{}}'::jsonb,
            is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_items_tenant_sku ON items (tenant_id, sku);
        ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS products_api_url TEXT;
        ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS inventory_source TEXT NOT NULL DEFAULT 'database';
        ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS publishable_key TEXT;
        ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS allowed_domains TEXT;
        ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
        CREATE TABLE IF NOT EXISTS faqs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_faqs_tenant ON faqs (tenant_id);
        CREATE TABLE IF NOT EXISTS tenant_subscriptions (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            plan_name TEXT NOT NULL DEFAULT 'Starter',
            monthly_minutes_limit INTEGER NOT NULL DEFAULT 500,
            minutes_used NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
            current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            current_period_end TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN NOT NULL DEFAULT TRUE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions (tenant_id);
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id TEXT PRIMARY KEY,
            plan_name TEXT NOT NULL,
            monthly_minutes_limit INTEGER NOT NULL DEFAULT 500,
            price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
            description TEXT NOT NULL DEFAULT '',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS service_items (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC(12, 2),
            duration_minutes INTEGER,
            category TEXT NOT NULL DEFAULT 'General',
            is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_service_items_tenant ON service_items (tenant_id);
        ALTER TABLE service_items ALTER COLUMN duration_minutes DROP NOT NULL;
        ALTER TABLE service_items ALTER COLUMN price DROP NOT NULL;
        CREATE TABLE IF NOT EXISTS call_logs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            customer_phone TEXT,
            duration_seconds INTEGER DEFAULT 0,
            transcript TEXT,
            summary TEXT,
            recording_url TEXT,
            cost NUMERIC(10, 4) DEFAULT 0,
            started_at TIMESTAMPTZ,
            ended_at TIMESTAMPTZ,
            call_type TEXT DEFAULT 'inbound',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_call_logs_tenant ON call_logs (tenant_id);
        ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'inbound';
        ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS identifier TEXT;

        CREATE TABLE IF NOT EXISTS leads (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            call_log_identifier TEXT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            stage TEXT NOT NULL DEFAULT 'new',
            score INTEGER NOT NULL DEFAULT 50,
            assigned_to TEXT,
            summary TEXT,
            source TEXT NOT NULL DEFAULT 'manual',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads (tenant_id);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_log_identifier TEXT;

        CREATE TABLE IF NOT EXISTS lead_tasks (
            id TEXT PRIMARY KEY,
            lead_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            title TEXT NOT NULL,
            due_date TIMESTAMP WITH TIME ZONE,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            assigned_to TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead ON lead_tasks (lead_id);

        CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            lead_id TEXT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_email TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
            tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
            tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            digital_signature TEXT,
            signed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes (tenant_id);

        CREATE TABLE IF NOT EXISTS quote_items (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            total_price NUMERIC(12, 2) NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items (quote_id);

        CREATE TABLE IF NOT EXISTS unified_orders (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'manual',
            order_type TEXT NOT NULL DEFAULT 'pickup',
            scheduled_date TIMESTAMP WITH TIME ZONE,
            status TEXT NOT NULL DEFAULT 'new',
            total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_unified_orders_tenant ON unified_orders (tenant_id);

        CREATE TABLE IF NOT EXISTS unified_order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_unified_order_items_order ON unified_order_items (order_id);
        """);

    if (!await db.SubscriptionPlans.AnyAsync())
    {
        db.SubscriptionPlans.AddRange(
            new SubscriptionPlan { Id = "plan_trial", PlanName = "Trial", MonthlyMinutesLimit = 30, Price = 0.00m, Description = "14 days / 30 calling minutes trial", IsActive = true, CreatedAt = DateTimeOffset.UtcNow },
            new SubscriptionPlan { Id = "plan_starter", PlanName = "Starter", MonthlyMinutesLimit = 500, Price = 50.00m, Description = "500 calling minutes included per month", IsActive = true, CreatedAt = DateTimeOffset.UtcNow },
            new SubscriptionPlan { Id = "plan_pro", PlanName = "Pro", MonthlyMinutesLimit = 1500, Price = 120.00m, Description = "1,500 calling minutes included per month", IsActive = true, CreatedAt = DateTimeOffset.UtcNow },
            new SubscriptionPlan { Id = "plan_premium", PlanName = "Premium", MonthlyMinutesLimit = 5000, Price = 350.00m, Description = "5,000 calling minutes included per month", IsActive = true, CreatedAt = DateTimeOffset.UtcNow }
        );
        await db.SaveChangesAsync();
    }
}
if (args.Contains("--seed-auth"))
{
    await AuthSeeder.SeedAsync(app.Services);
    return;
}
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontends");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", async (AppDbContext db) => Results.Ok(new { status = "healthy", database = await db.Database.CanConnectAsync() }));
app.MapControllers();
app.Run();