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

        var umerUser = await db.Users.SingleOrDefaultAsync(user => user.Email == "umer.farooq@alpha-devs.cloud");
        if (umerUser is null)
        {
            umerUser = new User { TenantId = "Alpha devs", Name = "Muhammad Umer Farooq", Email = "umer.farooq@alpha-devs.cloud", Phone = null, CreatedAt = now };
            db.Users.Add(umerUser);
        }
        umerUser.Role = "tenant_admin"; umerUser.IsActive = true;
        if (string.IsNullOrEmpty(umerUser.PasswordHash))
        {
            umerUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        }
        umerUser.UpdatedAt = now;

        await db.SaveChangesAsync();

        await SeedServicesForUserAsync(db, "umer.farooq@alpha-devs.cloud");
    }

    public static async Task<List<ServiceItem>> SeedServicesForUserAsync(AppDbContext db, string email = "umer.farooq@alpha-devs.cloud")
    {
        var now = DateTimeOffset.UtcNow;
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        string tenantId = !string.IsNullOrWhiteSpace(user?.TenantId) ? user.TenantId : "Alpha devs";

        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.TenantId == tenantId);
        if (tenant is null)
        {
            tenant = new Tenant
            {
                TenantId = tenantId,
                Name = tenantId,
                Status = "active",
                CreatedAt = now
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();
        }

        var serviceDefinitions = new (string Name, string Description, string Category)[]
        {
            ("Software Consultancy",
             "We help businesses navigate complex technical challenges with strategic guidance, architecture planning, and performance optimization ensuring every software decision drives measurable impact.",
             "Consultancy"),

            ("Custom websites",
             "From sleek corporate sites to dynamic platforms, we build high-performing, tailor-made websites that deliver engaging user experiences and reflect your brand's true identity.",
             "Web Development"),

            ("Mobile Applications",
             "Our team crafts powerful, intuitive mobile apps for Android and iOS combining great design with smooth performance to keep users engaged anytime, anywhere.",
             "Mobile Development"),

            ("Artificial Intelligence Integration",
             "We embed intelligent automation into your systems using AI, machine learning, NLP & Computer vision enabling smarter workflows, predictive analytics, and real-time decision-making.",
             "AI & Automation"),

            ("No-Code Development",
             "Accelerate your product launch with our no-code solutions. We empower businesses to build MVPs and internal tools quickly without compromising quality or scalability.",
             "No-Code"),

            ("Cloud Infrastructure & DevOps Services",
             "We design, deploy, and maintain scalable cloud environments with CI/CD pipelines, automated deployments, and secure infrastructure on AWS, Azure, and GCP.",
             "Cloud & DevOps"),

            ("Automation Tools & Agentic Services",
             "From process automation to data synchronization, we design tools that reduce manual effort, increase productivity, and allow your team to focus on what truly matters.",
             "Automation & AI"),

            ("Data Engineering & Analytics",
             "Transform raw data into actionable insights. Our data experts build robust pipelines, warehouses, and dashboards to help you make smarter, evidence-based business decisions.",
             "Data & Analytics"),

            ("Digital Marketing and SEO/AEO",
             "Boost visibility and engagement with targeted digital campaigns. From SEO and Analytics to AI-driven content strategies, we help your brand reach the right audience and convert.",
             "Marketing & SEO")
        };

        var existingServices = await db.Services.Where(s => s.TenantId == tenantId).ToListAsync();
        var resultList = new List<ServiceItem>();

        foreach (var def in serviceDefinitions)
        {
            var existing = existingServices.FirstOrDefault(s =>
                string.Equals(s.Name, def.Name, StringComparison.OrdinalIgnoreCase) ||
                (def.Name == "Mobile Applications" && (s.Name.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || s.Name.Contains("Application", StringComparison.OrdinalIgnoreCase))));

            if (existing != null)
            {
                existing.Description = def.Description;
                existing.Category = def.Category;
                existing.IsDisabled = false;
                existing.UpdatedAt = now;
                resultList.Add(existing);
            }
            else
            {
                var newService = new ServiceItem
                {
                    Id = Guid.NewGuid().ToString(),
                    TenantId = tenantId,
                    Name = def.Name,
                    Description = def.Description,
                    Category = def.Category,
                    Price = null,
                    DurationMinutes = null,
                    IsDisabled = false,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                db.Services.Add(newService);
                resultList.Add(newService);
            }
        }

        await db.SaveChangesAsync();
        return resultList;
    }
}