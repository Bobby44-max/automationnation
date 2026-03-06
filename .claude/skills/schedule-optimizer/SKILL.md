# Schedule Optimization Specialist

You are the scheduling intelligence authority for Rain Check. You understand the algorithms for finding clear days, optimal work windows, and the full reschedule cascade. When jobs need to move, you know the exact data flow — from weather evaluation through status update to notification dispatch.

---

## Trigger

Activate when the conversation involves: job rescheduling, finding clear days, weather windows, bulk operations, the BulkActionBar component, `findNextClearDay()`, `findBestWindows()`, or schedule optimization.

---

## findNextClearDay() Algorithm

Source: `convex/lib/weatherEngine.ts:240-302`

Finds the first future day where ALL trade rules pass (fully GREEN).

```
Input:  hourlyForecast[], tradePreset, scanDays (default 7)
Output: ClearDayResult | null

Algorithm:
1. Group hourly forecasts by date (ISO date string key)
2. Skip today — only evaluate future days
3. Sort dates chronologically, take first `scanDays`
4. For each date:
   a. Run evaluateWeatherRules() on that day's hours
   b. If status === "green":
      - Filter to work hours (8AM-5PM)
      - Calculate avgTemp, maxWind, avgHumidity, rainProb
      - Return { date, dayName, conditions, confidence, hoursAvailable }
5. If no green day found in scan range: return null
```

**ClearDayResult shape**:
```typescript
{
  date: string;           // "2026-03-08"
  dayName: string;        // "Sunday"
  conditions: {
    avgTemp: number;      // rounded
    maxWind: number;      // rounded
    avgHumidity: number;  // rounded
    rainProb: number;     // rounded, max across hours
  };
  confidence: number;     // based on hours-out tier
  hoursAvailable: number; // work hours with data
}
```

---

## findBestWindows() Algorithm

Source: `convex/lib/weatherEngine.ts:307-366`

Finds the best N-hour contiguous work blocks across a multi-day forecast. Gated to Business tier (`weatherWindows` entitlement).

```
Input:  hourlyForecast[], tradePreset, minHours (default 4), maxResults (default 3)
Output: WeatherWindow[]

Algorithm:
1. Filter all forecast hours to work window (8AM-5PM)
2. Slide a window of `minHours` length across work hours
3. For each window position:
   a. Verify all hours are on the same calendar day (skip cross-day blocks)
   b. Evaluate rules for this block with custom work window bounds
   c. If status === "green": score the window
4. Sort windows by score descending
5. Return top `maxResults`
```

**Window scoring** (`scoreWindow()`): Starts at 100, adds points for margin below thresholds, subtracts 50 for any threshold breach. Higher score = safer margin from danger zones.

**WeatherWindow shape**:
```typescript
{
  date: string;
  dayName: string;
  startHour: number;   // e.g., 8
  endHour: number;     // e.g., 12
  confidence: number;
  score: number;        // higher = more margin
  conditions: { avgTemp, avgHumidity, maxWind, rainProb };
}
```

---

## Reschedule Cascade

The exact sequence when a job gets rescheduled (manual or automatic):

### Step 1: Update Job Record
```
jobs.patch(jobId, {
  date: newDate,
  originalDate: job.originalDate || job.date,  // preserve first original
  status: "rescheduled"
})
```

### Step 2: Update Weather Status
```
jobWeatherStatus.patch(statusId, {
  autoRescheduled: true/false,
  newDate: newDate
})
```

### Step 3: Log Weather Action (Audit Trail)
```
weatherActions.insert({
  jobId, businessId,
  actionType: "rescheduled",
  fromDate: originalDate,
  toDate: newDate,
  reason: evaluation.summary,
  notificationsSent: 0,     // updated after notifications
  revenueProtected: job.estimatedRevenue,
  wasAutomatic: true/false,
  timestamp: Date.now()
})
```

### Step 4: Send Notifications
Dispatched via `sendRescheduleNotifications` action following the trade's `notificationChain` order.

---

## Bulk Operations

Gated to **Pro tier and above** via `checkEntitlement(tier, "bulkActions")`.

The BulkActionBar component (`app/(console)/scheduling/weather/components/BulkActionBar.tsx`) handles:
- Select all RED jobs
- "Reschedule All" — calls `sendRescheduleNotifications` action for each job with full context
- Passes: `jobId`, `businessId`, `businessName`, `trade`, `newDate`, `reason`, `notificationChain`, `clientName`, `clientPhone`, `clientEmail`, `crewLeadPhone`, `address`, `oldDate`, `startTime`

**Landscaping route-wide reschedule**: Landscaping presets have `bulkActions: true` and notification chain includes `all_route_clients` — designed for route-based operations where one weather event cancels an entire day's route.

---

## Override Flow

When a contractor manually overrides a weather status:

```
overrideJobStatus mutation:
1. Find jobWeatherStatus by jobId
2. Patch: { status: newStatus, overriddenBy: username, recommendation: "proceed" }
3. Log weatherAction: { actionType: "overridden", reason: "Manual override by {user}" }
```

This allows contractors to say "I know it's RED but I'm going anyway" — the system logs the override for liability tracking.

---

## Tier Gating for Schedule Features

| Feature | Starter ($79) | Pro ($129) | Business ($199) |
|---|---|---|---|
| Auto-reschedule | Yes | Yes | Yes |
| Bulk actions | No | Yes | Yes |
| Weather windows | No | No | Yes |
| Revenue scoring | No | No | Yes |

Check entitlements before exposing scheduling features:
```typescript
import { checkEntitlement } from "convex/lib/entitlements";
if (checkEntitlement(business.planTier, "bulkActions")) { /* show BulkActionBar */ }
if (checkEntitlement(business.planTier, "weatherWindows")) { /* show windows tab */ }
```

---

## MCP Integrations

- **Google Calendar** (`mcp__claude_ai_Google_Calendar__*`): Cross-reference owner/crew availability when suggesting reschedule dates — use `gcal_find_my_free_time` to find open slots, `gcal_list_events` to check conflicts before proposing a new date

---

## Key Files

| File | Purpose |
|---|---|
| `convex/lib/weatherEngine.ts` | `findNextClearDay()` (line 240), `findBestWindows()` (line 307), `scoreWindow()` |
| `convex/weatherScheduling.ts` | `rescheduleJob` mutation (line 362), `overrideJobStatus` (line 523), `cacheWeatherWindows` (line 560) |
| `convex/lib/entitlements.ts` | `checkEntitlement()`, `getTierLimits()` — tier gating |
| `convex/actions/runWeatherCheck.ts` | Auto-reschedule on RED (line 126-135) |
| `app/(console)/scheduling/weather/components/BulkActionBar.tsx` | Bulk reschedule UI |
| `app/(console)/scheduling/weather/WeatherSchedulingClient.tsx` | Main scheduling page — passes job data to BulkActionBar |
