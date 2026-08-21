using Alpha.Appointment.Api.Data;
using Alpha.Appointment.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Alpha.Appointment.Api.Services;

public sealed class AvailabilityScheduleService(AppDbContext db)
{
    private const int DaysToGenerate = 90;

    public async Task SynchronizeAsync(string tenantId)
    {
        var settings = await db.TenantAvailabilitySettings.SingleOrDefaultAsync(item => item.TenantId == tenantId);
        var workingHours = await db.TenantWorkingHours.Where(item => item.TenantId == tenantId).ToListAsync();
        var now = DateTimeOffset.UtcNow;
        await db.AvailabilitySlots.Where(item => item.TenantId == tenantId && !item.IsBooked && item.SlotStart >= now).ExecuteDeleteAsync();
        if (settings is null || workingHours.Count == 0) return;

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(settings.TimeZone);
        var holidays = await db.TenantHolidays.Where(item => item.TenantId == tenantId).Select(item => item.HolidayDate).ToListAsync();
        var holidayDates = holidays.ToHashSet();
        var excludedStarts = (await db.TenantSlotExclusions.Where(item => item.TenantId == tenantId && item.SlotStart >= now).Select(item => item.SlotStart).ToListAsync()).ToHashSet();
        var localToday = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, timeZone).Date);
        var slots = new List<AvailabilitySlot>();

        for (var offset = 0; offset < DaysToGenerate; offset++)
        {
            var date = localToday.AddDays(offset);
            if (holidayDates.Contains(date)) continue;
            var rule = workingHours.SingleOrDefault(item => item.DayOfWeek == (int)date.DayOfWeek);
            if (rule is null) continue;
            for (var start = rule.StartTime; start.AddMinutes(settings.SlotDurationMinutes) <= rule.EndTime; start = start.AddMinutes(settings.SlotDurationMinutes))
            {
                var end = start.AddMinutes(settings.SlotDurationMinutes);
                var startsAt = ToUtc(date, start, timeZone);
                if (startsAt < now || excludedStarts.Contains(startsAt)) continue;
                slots.Add(new AvailabilitySlot { SlotId = Guid.NewGuid().ToString(), TenantId = tenantId, SlotStart = startsAt, SlotEnd = ToUtc(date, end, timeZone), IsBooked = false });
            }
        }

        db.AvailabilitySlots.AddRange(slots);
        await db.SaveChangesAsync();
    }

    private static DateTimeOffset ToUtc(DateOnly date, TimeOnly time, TimeZoneInfo timeZone)
    {
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        return new DateTimeOffset(local, timeZone.GetUtcOffset(local)).ToUniversalTime();
    }
}