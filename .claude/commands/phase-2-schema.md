# Phase 2: SCHEMA — Data Layer, Types & Validators Agent

You are the **SCHEMA agent** — a senior data architect building the complete data layer for Apex Weather Scheduling.

## PREREQUISITES
- Phase 0 (SPEC): Read `docs/PRD.md` for data requirements
- Phase 1 (SCAFFOLD): Project structure must be in place

## YOUR MISSION
Define every table, type, validator, index, and access control rule. After this phase, every API function has a typed, validated, secure data layer to build on.

## STEPS

### Step 1: Audit existing schema
Read `apex-ui/convex/schema.ts`. Map existing tables against PRD requirements. Identify gaps.

### Step 2: Complete Convex schema
Ensure all tables exist with proper types and indexes:

#### Core Tables
```typescript
// weatherRules — Trade-specific rule presets per business
weatherRules: defineTable({
  businessId: v.string(),
  trade: v.string(),
  name: v.string(),
  rules: v.array(v.object({...})),
  checkTimes: v.array(v.string()),
  notificationChain: v.array(v.string()),
  isDefault: v.boolean(),
  isActive: v.boolean(),
}).index("by_business", ["businessId"])
  .index("by_business_trade", ["businessId", "trade"]),

// jobWeatherStatus — Current weather status per job
// weatherActions — Audit log of all automated actions
// weatherWindows — Cached optimal work windows
```

#### Auth & Tenant Tables
```typescript
// businesses — Multi-tenant root
businesses: defineTable({
  name: v.string(),
  ownerId: v.string(),      // Clerk user ID
  plan: v.string(),          // "free" | "starter" | "pro" | "business"
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  settings: v.object({...}),
  createdAt: v.number(),
}).index("by_owner", ["ownerId"]),

// users — Team members within a business
users: defineTable({
  clerkId: v.string(),
  businessId: v.string(),
  role: v.string(),          // "owner" | "admin" | "dispatcher" | "crew_lead"
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
}).index("by_clerk", ["clerkId"])
  .index("by_business", ["businessId"]),
```

#### Job Tables
```typescript
// jobs — The actual scheduled jobs
jobs: defineTable({
  businessId: v.string(),
  clientName: v.string(),
  trade: v.string(),
  location: v.object({ address: v.string(), zipCode: v.string(), lat: v.number(), lng: v.number() }),
  scheduledDate: v.string(),
  scheduledTime: v.string(),
  status: v.string(),        // "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled"
  assignedCrewId: v.optional(v.string()),
  estimatedRevenue: v.optional(v.number()),
  notes: v.optional(v.string()),
}).index("by_business_date", ["businessId", "scheduledDate"])
  .index("by_business", ["businessId"]),
```

#### Notification Tables
```typescript
// notifications — Sent notification log
notifications: defineTable({
  businessId: v.string(),
  jobId: v.optional(v.string()),
  type: v.string(),           // "sms" | "email" | "push"
  recipient: v.string(),
  message: v.string(),
  status: v.string(),         // "sent" | "delivered" | "failed"
  sentAt: v.number(),
  metadata: v.optional(v.any()),
}).index("by_business", ["businessId"])
  .index("by_job", ["jobId"]),
```

### Step 3: Create TypeScript types
Create `apex-ui/lib/types.ts` with exported types that mirror the schema:
- `WeatherRule`, `WeatherRulePreset`
- `JobWeatherStatus`, `WeatherStatusColor`
- `WeatherAction`, `WeatherActionType`
- `WeatherWindow`, `WeatherConditions`
- `Business`, `PricingPlan`
- `User`, `UserRole`
- `Job`, `JobStatus`
- `Notification`, `NotificationType`

### Step 4: Create validators
Create `apex-ui/convex/validators.ts` with reusable Convex validators:
- `tradeValidator` — validates trade name against known trades
- `statusColorValidator` — "green" | "yellow" | "red"
- `ruleOperatorValidator` — ">=" | "<=" | ">" | "<"
- `planValidator` — "free" | "starter" | "pro" | "business"
- `roleValidator` — "owner" | "admin" | "dispatcher" | "crew_lead"

### Step 5: Create indexes
Add Convex indexes for every query pattern in the PRD:
- Jobs by business + date (dashboard view)
- Weather status by business + date (weather overlay)
- Actions by business + date range (audit log)
- Rules by business + trade (rule evaluation)
- Users by business (team management)
- Notifications by business + job (notification history)

### Step 6: Seed data update
Update `apex-ui/convex/seedData.ts` to include:
- 1 test business with all settings
- 3 trade presets (roofing, painting, landscaping) with real thresholds
- 10 sample jobs across different trades and dates
- Sample weather statuses (mix of green/yellow/red)
- Sample weather actions (reschedules, notifications)

### Step 7: Validate
- Run `npx convex dev` — schema must deploy without errors
- Run `npx tsc --noEmit` — all types must resolve
- Verify all indexes match query patterns from PRD

## QUALITY BAR
After this phase, every piece of data has a type, every type has a validator, every query has an index, and the seed data tells the full product story.
