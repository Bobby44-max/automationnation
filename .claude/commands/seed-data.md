# Utility: Seed Data — Generate or Refresh Development Data

You are the **SEED DATA agent** — populating the Convex database with realistic test data for development.

## WHAT THIS DOES
Creates a complete set of realistic test data so every UI component has data to render during development.

## STEPS

### Step 1: Read existing seed data
Read `apex-ui/convex/seedData.ts` to understand current seed structure.

### Step 2: Verify or create seed function
Ensure there's a runnable Convex function that populates all tables:

```typescript
// Seed data must include:

// 1. Business
{
  name: "Apex Home Services",
  plan: "pro",
  settings: { timezone: "America/New_York", defaultTrade: "roofing" }
}

// 2. Trade Presets (3 minimum)
- Roofing: wind 25mph cancel, 20mph warn, rain 70% cancel, temp 40°F cancel
- Exterior Painting: humidity 85% cancel, 70% warn, temp 50°F cancel, dew point spread 5°F cancel
- Landscaping: rain 60% reschedule route, temp 80°F warn, wind 15mph cancel chemical

// 3. Jobs (10-15 for today + tomorrow)
Mix of:
- Different trades
- Different times (7AM through 5PM)
- Different locations (3-4 zip codes)
- Different clients
- Realistic revenue amounts ($200-$15,000)

// 4. Weather Statuses
- 60% green (proceeding normally)
- 25% yellow (caution — crew lead notified)
- 15% red (cancelled/rescheduled)

// 5. Weather Actions (5-8 recent)
- Auto-reschedules with reasons
- Notifications sent
- Manual overrides
- Revenue protected calculations

// 6. Sample Notifications
- Mix of SMS and email
- Mix of sent/delivered/failed
- Realistic message content
```

### Step 3: Run the seed
```bash
npx convex run seedData:seed
```

### Step 4: Verify
Check that data appears in Convex dashboard and the UI renders correctly.

## IMPORTANT
- Seed data should be idempotent (safe to run multiple times)
- Clear existing seed data before re-seeding
- Never seed production — check environment first
- Use realistic names, addresses, and weather data
