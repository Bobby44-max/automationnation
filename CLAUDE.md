# Apex Weather Scheduling — Project Brain

> **Product**: AI-powered weather scheduling automation for 5,000+ service businesses
> **Stack**: Next.js 15 (App Router) + Convex (backend) + Clerk (auth) + Stripe (billing)
> **Repo**: `automationnation` — production-ready monorepo

---

## ARCHITECTURE

```
automationnation/
├── CLAUDE.md                          ← You are here
├── .claude/
│   ├── settings.json                  ← MCP servers, permissions
│   └── commands/                      ← Phase agents + utility commands
├── app/
│   ├── layout.tsx                     ← Root layout with ClerkProvider + ConvexProvider
│   ├── page.tsx                       ← Landing page
│   ├── providers.tsx                  ← Auth + DB providers
│   ├── error.tsx                      ← Global error boundary
│   ├── not-found.tsx                  ← 404 page
│   ├── (console)/                     ← Authenticated app shell
│   │   ├── layout.tsx                 ← Sidebar + Topbar (force-dynamic)
│   │   ├── dashboard/page.tsx         ← Today's weather overview
│   │   ├── scheduling/weather/        ← Weather scheduling pages
│   │   │   ├── page.tsx + WeatherSchedulingClient.tsx
│   │   │   ├── settings/page.tsx      ← Weather rules editor
│   │   │   └── components/            ← JobCard, WeatherStatsBar, etc.
│   │   ├── notifications/page.tsx     ← Notification history
│   │   ├── settings/page.tsx          ← Business profile
│   │   └── billing/page.tsx           ← Stripe subscription management
│   ├── sign-in/                       ← Clerk sign-in
│   ├── sign-up/                       ← Clerk sign-up
│   └── api/
│       ├── health/route.ts            ← Health check endpoint
│       └── webhooks/stripe/route.ts   ← Stripe webhook handler
├── convex/
│   ├── schema.ts                      ← 10 tables, 22+ indexes
│   ├── weatherScheduling.ts           ← 9 queries + 8 mutations
│   ├── seedData.ts                    ← 5 trade preset seeder
│   ├── crons.ts                       ← Daily 5 AM weather check
│   ├── auth.config.ts                 ← Clerk JWT integration
│   ├── lib/
│   │   ├── auth.ts                    ← getAuthenticatedBusinessId()
│   │   ├── weatherEngine.ts           ← Deterministic rule evaluation
│   │   ├── weatherApi.ts              ← Tomorrow.io + OWM with fallback
│   │   ├── notificationTemplates.ts   ← 7 template types
│   │   └── entitlements.ts            ← 4-tier feature gating
│   └── actions/
│       ├── runWeatherCheck.ts         ← Master check per business
│       ├── batchWeatherCheck.ts       ← Scale: 50 businesses per batch
│       ├── sendSms.ts                 ← Twilio with 3-retry backoff
│       ├── sendEmail.ts               ← SendGrid
│       └── sendNotifications.ts       ← Chain dispatcher
├── components/
│   ├── console/                       ← Sidebar, Topbar
│   └── ui/                            ← Button, Card, Badge, Input, etc.
├── lib/
│   ├── utils.ts                       ← cn() utility
│   ├── ui/theme.ts                    ← Design system tokens
│   └── cloud/aif-executor-ref/        ← Original JS code (reference only)
├── middleware.ts                       ← Clerk auth middleware
├── research/                          ← Market research & strategy docs
└── n8n-workflows/                     ← Legacy n8n JSONs (reference)
```

## CORE DOMAIN

**Weather rule engine**: Deterministic (no LLM) — `if wind >= 25mph → cancel`.
**Template notifications**: 7 types, no AI dependency in critical path.
**Trade presets**: Roofing, exterior painting, landscaping, concrete, pressure washing.
**Status system**: GREEN (proceed) / YELLOW (warn) / RED (cancel + auto-reschedule).
**Scale**: 5,000+ businesses via zip code dedup + batch processing.

## KEY TABLES (Convex)

| Table | Purpose |
|---|---|
| `businesses` | Business profile + clerkOrgId + planTier |
| `weatherRules` | Trade presets + custom overrides per business |
| `jobWeatherStatus` | Current green/yellow/red per job |
| `weatherActions` | Log of reschedules, notifications, overrides |
| `weatherWindows` | Cached optimal work windows for the week |
| `weatherChecks` | Weather API call cache (2hr TTL) |
| `notifications` | SMS/email send log with status tracking |

## PRICING TIERS

| Tier | Name | Price | Key Limits |
|---|---|---|---|
| Free | Storm Watch | $0/mo | 1 trade, 5 jobs/week, email only |
| Starter | Clear Day | $29/mo | 1 trade, 10 jobs/day, 50 SMS/mo |
| Pro | All Clear | $79/mo | Unlimited trades, 500 SMS/mo, bulk actions |
| Business | Storm Command | $149/mo | Weather windows, revenue scoring, API |

## CONVENTIONS

- **No mocks in production code.** All UI consumes real Convex queries/mutations.
- **Tenant isolation is mandatory.** Every query/mutation filters by businessId.
- **Weather engine is deterministic.** Rule evaluation is pure TS — no LLM in critical path.
- **Template notifications always work.** No AI dependency for sending notifications.
- **Trade presets are data, not code.** Stored in weatherRules table, not hardcoded.
- **Contractor-first design.** Solid dark backgrounds, high contrast, large touch targets. No Glass UI.
- **Status colors are semantic:** GREEN = proceed, YELLOW = warn, RED = reschedule.

## ENVIRONMENT VARIABLES

```
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
TOMORROW_IO_API_KEY=
OPENWEATHERMAP_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## CRITICAL RULES

1. **Never expose API keys client-side.** All external API calls go through Convex actions.
2. **Never hardcode business logic.** Weather rules and thresholds live in the database.
3. **Never query without businessId.** Multi-tenant isolation is non-negotiable.
4. **Never deploy without build check.** Run `npm run build` before push.
5. **Always filter by businessId.** Every query/mutation must scope to the authenticated business.
