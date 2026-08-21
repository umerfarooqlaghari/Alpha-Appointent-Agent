using System.Text;
using Alpha.Appointment.Api.Data;
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
        CREATE TABLE IF NOT EXISTS faqs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_faqs_tenant ON faqs (tenant_id);
        """);
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