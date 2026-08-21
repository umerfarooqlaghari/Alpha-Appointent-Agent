using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Services;

public static class AuthSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tenant_user';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
            """);

        const string password = "132Careras@!";
        var now = DateTimeOffset.UtcNow;
        var superadmin = await db.Users.SingleOrDefaultAsync(user => user.Email == "admin@alphadevs.com");
        if (superadmin is null)
        {
            superadmin = new User { Name = "Super Admin", Email = "admin@alphadevs.com", Phone = "+10000000000", CreatedAt = now };
            db.Users.Add(superadmin);
        }
        superadmin.TenantId = null; superadmin.Role = "superadmin"; superadmin.IsActive = true; superadmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password); superadmin.UpdatedAt = now;

        var tenantAdmin = await db.Users.SingleOrDefaultAsync(user => user.Email == "alpha-devs-admin@alphadevs.com");
        if (tenantAdmin is null)
        {
            tenantAdmin = new User { TenantId = "Alpha devs", Name = "Alpha Devs Admin", Email = "alpha-devs-admin@alphadevs.com", Phone = null, CreatedAt = now };
            db.Users.Add(tenantAdmin);
        }
        tenantAdmin.Role = "tenant_admin"; tenantAdmin.IsActive = true; tenantAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password); tenantAdmin.UpdatedAt = now;
        await db.SaveChangesAsync();
    }
}