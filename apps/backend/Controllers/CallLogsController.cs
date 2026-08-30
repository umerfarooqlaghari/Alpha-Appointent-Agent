using System.Security.Claims;
using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Controllers;

[ApiController, Route("api/tenants/{tenantId}/call-logs")]
[Authorize]
public sealed class CallLogsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> GetCallLogs(string tenantId)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();

        var logs = await db.CallLogs
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Results.Ok(logs);
    }

    [HttpGet("{id}")]
    public async Task<IResult> GetCallLog(string tenantId, string id)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();

        var log = await db.CallLogs.SingleOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id);
        if (log is null) return Results.NotFound();

        return Results.Ok(log);
    }

    [HttpGet("{id}/audio")]
    [AllowAnonymous]
    public async Task<IResult> GetCallAudio(string tenantId, string id, [FromServices] IConfiguration config)
    {
        var log = await db.CallLogs.SingleOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id);
        if (log is null) return Results.NotFound();

        var vapiKey = config["Vapi:PrivateKey"] ?? "7c44b5b3-f1d1-4e9d-acc0-dd98df767757";

        using var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", vapiKey.Trim());

        var vapiRes = await client.GetAsync($"https://api.vapi.ai/call/{id}");
        if (!vapiRes.IsSuccessStatusCode)
        {
            return Results.Problem($"Failed to fetch audio metadata from Vapi: {vapiRes.StatusCode}");
        }

        var jsonString = await vapiRes.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(jsonString);
        var root = doc.RootElement;

        string? presignedUrl = null;
        
        // 1. Check artifact object first (where Vapi places presigned AWS S3/R2 signed audio links)
        if (root.TryGetProperty("artifact", out var artifactProp) && artifactProp.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (artifactProp.TryGetProperty("presignedMonoUrl", out var pMono) && pMono.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = pMono.GetString();
            else if (artifactProp.TryGetProperty("presignedStereoUrl", out var pStereo) && pStereo.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = pStereo.GetString();
            else if (artifactProp.TryGetProperty("presignedAssistantUrl", out var pAsst) && pAsst.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = pAsst.GetString();
        }

        // 2. Fall back to root level properties
        if (string.IsNullOrWhiteSpace(presignedUrl))
        {
            if (root.TryGetProperty("presignedMonoUrl", out var monoProp) && monoProp.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = monoProp.GetString();
            else if (root.TryGetProperty("presignedStereoUrl", out var stereoProp) && stereoProp.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = stereoProp.GetString();
            else if (root.TryGetProperty("recordingUrl", out var recProp) && recProp.ValueKind == System.Text.Json.JsonValueKind.String)
                presignedUrl = recProp.GetString();
        }

        if (string.IsNullOrWhiteSpace(presignedUrl))
        {
            return Results.NotFound(new { error = "No recording URL available for this call." });
        }

        return Results.Redirect(presignedUrl);
    }

    [HttpPost]
    public async Task<IResult> CreateCallLog(string tenantId, CreateCallLogRequest request)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();

        var log = new CallLog
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = tenantId,
            CustomerPhone = request.CustomerPhone,
            DurationSeconds = request.DurationSeconds,
            Transcript = request.Transcript,
            Summary = request.Summary,
            RecordingUrl = request.RecordingUrl,
            Cost = request.Cost,
            StartedAt = request.StartedAt ?? DateTimeOffset.UtcNow.AddSeconds(-request.DurationSeconds),
            EndedAt = request.EndedAt ?? DateTimeOffset.UtcNow,
            CallType = string.IsNullOrWhiteSpace(request.CallType) ? "inbound" : request.CallType,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.CallLogs.Add(log);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tenants/{tenantId}/call-logs/{log.Id}", log);
    }

    [HttpDelete("{id}")]
    public async Task<IResult> DeleteCallLog(string tenantId, string id)
    {
        if (!CanAccess(tenantId)) return Results.Forbid();

        var log = await db.CallLogs.SingleOrDefaultAsync(c => c.TenantId == tenantId && c.Id == id);
        if (log is null) return Results.NotFound();

        db.CallLogs.Remove(log);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    [HttpPost("sync-vapi")]
    [AllowAnonymous]
    public async Task<IResult> SyncVapiCallLogs(string tenantId, SyncVapiCallLogsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VapiPrivateKey))
        {
            return Results.BadRequest(new { error = "Vapi Private API Key is required." });
        }

        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.VapiPrivateKey.Trim());

            var url = "https://api.vapi.ai/call?limit=100";
            if (!string.IsNullOrWhiteSpace(request.AssistantId))
            {
                url += $"&assistantId={Uri.EscapeDataString(request.AssistantId.Trim())}";
            }

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                return Results.BadRequest(new { error = $"Vapi API error: {response.StatusCode}", details = errorBody });
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            if (root.ValueKind != System.Text.Json.JsonValueKind.Array)
            {
                return Results.Ok(new { count = 0, message = "No call records returned from Vapi." });
            }

            int syncedCount = 0;
            foreach (var element in root.EnumerateArray())
            {
                var callId = element.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
                if (string.IsNullOrWhiteSpace(callId)) continue;

                // Customer Phone
                string? customerPhone = null;
                if (element.TryGetProperty("customer", out var custProp) && custProp.ValueKind == System.Text.Json.JsonValueKind.Object && custProp.TryGetProperty("number", out var numProp))
                {
                    customerPhone = numProp.GetString();
                }
                else if (element.TryGetProperty("phoneNumber", out var phoneProp) && phoneProp.ValueKind == System.Text.Json.JsonValueKind.Object && phoneProp.TryGetProperty("number", out var pNumProp))
                {
                    customerPhone = pNumProp.GetString();
                }

                // Duration
                int durationSeconds = 0;
                if (element.TryGetProperty("durationSeconds", out var durSecProp) && durSecProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    durationSeconds = (int)Math.Round(durSecProp.GetDouble());
                }

                // Timestamps
                DateTimeOffset? startedAt = null;
                DateTimeOffset? endedAt = null;
                if (element.TryGetProperty("startedAt", out var startProp) && startProp.ValueKind == System.Text.Json.JsonValueKind.String && DateTimeOffset.TryParse(startProp.GetString(), out var sAt)) startedAt = sAt;
                if (element.TryGetProperty("endedAt", out var endProp) && endProp.ValueKind == System.Text.Json.JsonValueKind.String && DateTimeOffset.TryParse(endProp.GetString(), out var eAt)) endedAt = eAt;

                if (durationSeconds <= 0 && startedAt.HasValue && endedAt.HasValue)
                {
                    durationSeconds = (int)Math.Round((endedAt.Value - startedAt.Value).TotalSeconds);
                }

                // Transcript
                string? transcript = element.TryGetProperty("transcript", out var trProp) && trProp.ValueKind == System.Text.Json.JsonValueKind.String ? trProp.GetString() : null;

                // Summary
                string? summary = null;
                if (element.TryGetProperty("summary", out var sumProp) && sumProp.ValueKind == System.Text.Json.JsonValueKind.String) summary = sumProp.GetString();
                else if (element.TryGetProperty("analysis", out var anProp) && anProp.ValueKind == System.Text.Json.JsonValueKind.Object && anProp.TryGetProperty("summary", out var aSumProp) && aSumProp.ValueKind == System.Text.Json.JsonValueKind.String) summary = aSumProp.GetString();

                // Recording URL
                string? recordingUrl = null;
                if (element.TryGetProperty("recordingUrl", out var recProp) && recProp.ValueKind == System.Text.Json.JsonValueKind.String) recordingUrl = recProp.GetString();
                else if (element.TryGetProperty("stereoRecordingUrl", out var sRecProp) && sRecProp.ValueKind == System.Text.Json.JsonValueKind.String) recordingUrl = sRecProp.GetString();

                // Cost
                decimal cost = 0;
                if (element.TryGetProperty("cost", out var costProp) && costProp.ValueKind == System.Text.Json.JsonValueKind.Number) cost = costProp.GetDecimal();

                // Call Type
                string callType = "inbound";
                if (element.TryGetProperty("type", out var typeProp) && typeProp.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    var rawT = typeProp.GetString()?.ToLower() ?? "";
                    if (rawT.Contains("outbound")) callType = "outbound";
                    else if (rawT.Contains("web")) callType = "web";
                }

                // Upsert into db.CallLogs
                var existingLog = await db.CallLogs.SingleOrDefaultAsync(c => c.Id == callId);
                if (existingLog is null)
                {
                    db.CallLogs.Add(new CallLog
                    {
                        Id = callId,
                        TenantId = tenantId,
                        CustomerPhone = customerPhone,
                        DurationSeconds = durationSeconds,
                        Transcript = transcript,
                        Summary = summary,
                        RecordingUrl = recordingUrl,
                        Cost = cost,
                        StartedAt = startedAt,
                        EndedAt = endedAt,
                        CallType = callType,
                        CreatedAt = startedAt ?? DateTimeOffset.UtcNow
                    });
                    syncedCount++;
                }
                else
                {
                    existingLog.CustomerPhone = customerPhone ?? existingLog.CustomerPhone;
                    existingLog.DurationSeconds = durationSeconds > 0 ? durationSeconds : existingLog.DurationSeconds;
                    existingLog.Transcript = transcript ?? existingLog.Transcript;
                    existingLog.Summary = summary ?? existingLog.Summary;
                    existingLog.RecordingUrl = recordingUrl ?? existingLog.RecordingUrl;
                    existingLog.Cost = cost > 0 ? cost : existingLog.Cost;
                    existingLog.StartedAt = startedAt ?? existingLog.StartedAt;
                    existingLog.EndedAt = endedAt ?? existingLog.EndedAt;
                    existingLog.CallType = callType;
                    syncedCount++;
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { count = syncedCount, message = $"Successfully imported/updated {syncedCount} call records from Vapi." });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to sync calls from Vapi: {ex.Message}");
        }
    }

    private bool CanAccess(string tenantId) => User.IsInRole("superadmin") || User.FindFirstValue("tenant_id") == tenantId;
}

public sealed record SyncVapiCallLogsRequest(string VapiPrivateKey, string? AssistantId);

public sealed record CreateCallLogRequest(
    string? CustomerPhone,
    int DurationSeconds,
    string? Transcript,
    string? Summary,
    string? RecordingUrl,
    decimal Cost,
    DateTimeOffset? StartedAt,
    DateTimeOffset? EndedAt,
    string? CallType
);
