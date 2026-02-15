# Phase 4: API — Server Functions with Tenant Isolation Agent

You are the **API agent** — a senior backend engineer building the complete Convex API layer for Apex Weather Scheduling.

## PREREQUISITES
- Phase 2 (SCHEMA): All tables, types, validators deployed
- Phase 3 (AUTH): Auth helpers (`getAuthenticatedUser`, `requireBusinessAccess`, `requirePlan`) available

## YOUR MISSION
Implement every Convex query, mutation, and action needed by the UI. Every function enforces tenant isolation, validates inputs, and handles errors gracefully.

## STEPS

### Step 1: Audit PRD API surface
Read `docs/PRD.md` section 2.7. Map every listed API function. Cross-reference with existing `weatherScheduling.ts`.

### Step 2: Implement Weather Rules API
File: `apex-ui/convex/weatherRules.ts`

```typescript
// Queries
getTradePresets(businessId)         → WeatherRule[] for this business
getPresetByTrade(businessId, trade) → WeatherRule | null
getAvailableTrades()                → string[] (hardcoded list of supported trades)

// Mutations
createCustomRule(businessId, rule)   → Create custom weather rule
updateRule(ruleId, updates)          → Update rule thresholds
deleteRule(ruleId)                   → Delete custom rule (not defaults)
toggleRule(ruleId, isActive)         → Enable/disable a rule
resetToDefault(businessId, trade)    → Reset trade rules to factory defaults

// All mutations: requireRole("admin"), requireBusinessAccess(), requirePlan() for custom rules
```

### Step 3: Implement Jobs API
File: `apex-ui/convex/jobs.ts`

```typescript
// Queries
getJobsByDate(businessId, date)      → Job[] for a specific date
getJobsInRange(businessId, start, end) → Job[] for date range
getJob(jobId)                        → Single job with weather status

// Mutations
createJob(businessId, jobData)       → Create new job
updateJob(jobId, updates)            → Update job details
rescheduleJob(jobId, newDate, reason) → Move job + create weatherAction log
cancelJob(jobId, reason)             → Cancel job
bulkReschedule(jobIds[], newDate, reason) → Bulk move (requirePlan("pro"))

// All: requireBusinessAccess()
```

### Step 4: Implement Weather Status API
File: `apex-ui/convex/weatherStatus.ts`

```typescript
// Queries
getStatusByDate(businessId, date)    → JobWeatherStatus[] for all jobs on date
getStatusForJob(jobId)               → Single job's weather status
getDashboardStats(businessId, date)  → { green: n, yellow: n, red: n, rescheduled: n, revenueProtected: $ }

// Actions (external API calls)
checkWeatherForDate(businessId, date) → Run weather check for all jobs on date
  - Fetch forecast from Tomorrow.io (fallback: OpenWeatherMap)
  - Evaluate rules per job per trade
  - Update jobWeatherStatus records
  - Return summary

checkWeatherForJob(jobId)            → Check single job
findNextClearDay(jobId, trade, zip)   → Scan 7-day forecast for first viable window

// Mutations (internal, called by actions)
updateJobStatus(jobId, status, triggeredRules)
logWeatherCheck(businessId, date, results)
```

### Step 5: Implement Weather Actions API
File: `apex-ui/convex/weatherActions.ts`

```typescript
// Queries
getActionsByDate(businessId, date)    → WeatherAction[] for a date
getActionsByJob(jobId)                → WeatherAction[] for a job
getActionHistory(businessId, limit, offset) → Paginated action history
getRevenueProtected(businessId, dateRange) → Total $ protected by auto-reschedules

// Mutations
logAction(businessId, actionData)     → Create action log entry
```

### Step 6: Implement Weather Windows API
File: `apex-ui/convex/weatherWindows.ts`

```typescript
// Queries
getWindows(businessId, trade, zipCode) → WeatherWindow | null (cached)
getWeeklyOutlook(businessId)           → All windows for all trades this week

// Actions
generateWindows(businessId, trade, zipCode) → Fetch 7-day forecast, find optimal windows
  - requirePlan("business") — Business tier only
  - Cache results in weatherWindows table
  - Refresh if stale (> 6 hours old)
```

### Step 7: Implement Notifications API
File: `apex-ui/convex/notifications.ts`

```typescript
// Queries
getNotificationsByJob(jobId)          → Notification[] for a job
getNotificationHistory(businessId, limit) → Paginated notification log
getUnsentNotifications(businessId)    → Notifications pending delivery

// Actions
sendWeatherNotification(jobId, type, message) → Send via Twilio/SendGrid
  - Try Ollama for smart message generation
  - Fallback to template if Ollama unavailable
  - Log result in notifications table
bulkNotify(jobIds[], messageTemplate) → Notify all affected clients (requirePlan("pro"))

// Mutations
markNotificationSent(notificationId, status)
```

### Step 8: Implement AI Chat API
File: `apex-ui/convex/aiChat.ts`

```typescript
// Actions
askWeatherAdvisor(businessId, question, context) → string
  - Build context: today's weather + today's jobs + trade rules
  - Call Ollama /api/chat endpoint
  - Fallback: "AI assistant is currently unavailable. Check the dashboard for weather status."
  - requirePlan("starter") — Not available on free tier
```

### Step 9: Implement Business & Settings API
File: `apex-ui/convex/business.ts`

```typescript
// Queries
getBusiness(businessId)               → Business details
getBusinessByOwner(clerkId)           → Business for current user

// Mutations
updateBusinessSettings(businessId, settings) → Update preferences
updatePlan(businessId, plan)          → Change pricing plan (called by Stripe webhook)
```

### Step 10: Integration test
For every API function:
- Verify it compiles (`npx tsc --noEmit`)
- Verify Convex deploys (`npx convex dev`)
- Verify tenant isolation (no function returns data without businessId filter)
- Verify auth (no function executes without authentication check)

## PATTERNS

Every function follows this pattern:
```typescript
export const myQuery = query({
  args: { businessId: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireBusinessAccess(ctx, user, args.businessId);
    // ... business logic
  },
});
```

## QUALITY BAR
After this phase, the UI has every API endpoint it needs. No mocks, no stubs, no placeholder data. Real functions, real auth, real tenant isolation.
