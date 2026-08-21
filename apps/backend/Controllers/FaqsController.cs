using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/faqs")]
[Authorize]
public sealed class FaqsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetFaqs(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var faqs = await db.Faqs
            .Where(f => f.TenantId == tenantId)
            .OrderBy(f => f.CreatedAt)
            .ToListAsync();
        return Results.Ok(faqs);
    }

    [HttpPost]
    public async Task<IResult> CreateFaq(string tenantId, CreateFaqRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
            return Results.BadRequest(new { error = "Question and Answer are required." });

        var newFaq = new Faq
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            Question = request.Question.Trim(),
            Answer = request.Answer.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Faqs.Add(newFaq);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/faqs/{newFaq.Id}", newFaq);
    }

    [HttpPut("{faqId}")]
    public async Task<IResult> UpdateFaq(string tenantId, string faqId, UpdateFaqRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
            return Results.BadRequest(new { error = "Question and Answer are required." });

        var faq = await db.Faqs.SingleOrDefaultAsync(f => f.TenantId == tenantId && f.Id == faqId);
        if (faq is null) return Results.NotFound();

        faq.Question = request.Question.Trim();
        faq.Answer = request.Answer.Trim();
        faq.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(faq);
    }

    [HttpDelete("{faqId}")]
    public async Task<IResult> DeleteFaq(string tenantId, string faqId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();
        var faq = await db.Faqs.SingleOrDefaultAsync(f => f.TenantId == tenantId && f.Id == faqId);
        if (faq is null) return Results.NotFound();

        db.Faqs.Remove(faq);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record CreateFaqRequest(string Question, string Answer);
public sealed record UpdateFaqRequest(string Question, string Answer);
