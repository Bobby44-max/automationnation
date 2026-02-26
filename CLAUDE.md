# Apex Weather Scheduling — Project Brain

> **Product**: AI-powered weather scheduling automation for service businesses
> **Stack**: Next.js (App Router) + Convex (backend) + Ollama (local LLM) + Claude Code Agent (orchestration)
> **Repo**: `automationnation` — monorepo with `apex-ui/` as the main application

---

## ARCHITECTURE

```
automationnation/
├── CLAUDE.md                          ← You are here
├── .claude/
│   ├── settings.json                  ← MCP servers, permissions
│   └── commands/                      ← Phase agents + utility commands
├── apex-ui/
│   ├── app/(console)/
│   │   ├── scheduling/weather/        ← Weather dashboard + settings
│   │   ├── terminal/                  ← Agent Terminal UI
│   │   │   ├── page.tsx
│   │   │   └── AgentTerminal.tsx      ← React terminal component
│   │   └── ...                        ← Dashboard, notifications, settings
│   ├── app/api/agent/run/route.ts     ← Vercel SSE endpoint (auth + poll + stream)
│   ├── convex/                        ← Convex backend
│   │   ├── schema.ts                  ← Tables: weatherRules, jobWeatherStatus, etc.
│   │   ├── weatherScheduling.ts       ← Queries, mutations, actions
│   │   ├── seedData.ts                ← Dev seed data
│   │   └── aifCompiler/workflows/     ← AIF workflow definitions
│   ├── cloud/
│   │   ├── agent-server/              ← Claude Code Agent Server (replaces n8n)
│   │   │   ├── agent-server.js        ← 4 actions: start, approve, poll, cancel
│   │   │   └── deploy/               ← Traefik config, systemd service, setup script
│   │   └── aif-executor/             ← AIF execution engine (legacy, being replaced)
│   └── n8n-workflows/                ← n8n automation JSONs (legacy, being replaced)
└── research/                          ← Market research & strategy docs
```

## AGENT TERMINAL ARCHITECTURE

```
Browser (Terminal UI at /terminal)
  → Vercel API (/api/agent/run) [auth + SSE streaming]
    → HTTPS POST → Traefik (:443, Hostinger VPS)
      → agent-server.js (:3847)
        → Claude Code CLI (spawned process)
          → reads codebase, weather APIs, Convex
          → writes output to /tmp/agent-sessions/{id}.jsonl
      → Vercel polls JSONL every 1.5s
    → SSE streams back to Terminal UI
```

**Two-Phase Security:**
- **Phase 1 (Investigate):** Read-only — Claude can read files, search, analyze
- **Phase 2 (Approve):** Write access granted only after explicit user approval in terminal

## CORE DOMAIN

**Weather rule engine**: Deterministic (no LLM) — `if wind >= 25mph → cancel`.
**Ollama layer**: Smart notifications, AI chat, weekly summaries. Always has template fallback.
**Trade presets**: Roofing, exterior painting, landscaping (with real industry thresholds).
**Status system**: GREEN (proceed) / YELLOW (warn) / RED (cancel + auto-reschedule).

## KEY TABLES (Convex)

| Table | Purpose |
|---|---|
| `weatherRules` | Trade presets + custom overrides per business |
| `jobWeatherStatus` | Current green/yellow/red per job |
| `weatherActions` | Log of reschedules, notifications, overrides |
| `weatherWindows` | Cached optimal work windows for the week |

## BUILD PHASES

| Phase | Command | Focus |
|---|---|---|
| 0 | `/phase-0-spec` | Complete PRD before any code |
| 1 | `/phase-1-scaffold` | All deps, config, structure |
| 2 | `/phase-2-schema` | Data layer, types, validators, RLS |
| 3 | `/phase-3-auth` | Middleware, RBAC, sign-in/up |
| 4 | `/phase-4-api` | Server functions with tenant isolation |
| 5 | `/phase-5-ui` | Pages consuming real APIs (no mocks) |
| 6 | `/phase-6-integrations` | Stripe, email, external APIs |
| 7 | `/phase-7-polish` | SEO, error boundaries, accessibility |
| 8 | `/phase-8-validate` | Security audit + build checks |
| 9 | `/phase-9-deploy` | Env vars, ship, smoke test |

## UTILITY COMMANDS

| Command | Purpose |
|---|---|
| `/weather-check` | Validate weather API integration end-to-end |
| `/seed-data` | Generate or refresh Convex seed data |
| `/project-status` | Audit current state vs. build phases |

## CONVENTIONS

- **No mocks in production code.** All UI must consume real Convex queries/mutations.
- **Tenant isolation is mandatory.** Every query/mutation filters by `businessId`.
- **Ollama always has a template fallback.** If Ollama is down, notifications still send.
- **Trade presets are data, not code.** Store in `weatherRules` table, not hardcoded.
- **Weather engine is deterministic.** Rule evaluation is pure JS — no LLM in the critical path.
- **Status colors are semantic:** GREEN = proceed, YELLOW = warn crew lead, RED = auto-reschedule + notify all.

## PRICING TIERS (for feature gating)

| Tier | Name | Price | Key Limits |
|---|---|---|---|
| Trial | 14-Day Trial | $0 × 14 days | All Clear Day features, 50 SMS |
| Solo | Clear Day | $59/mo | 1 trade, 15 jobs/day, 500 SMS/mo |
| Team | All Clear | $149/mo | 3 trades, unlimited jobs, 2,000 SMS/mo |
| Business | Storm Command | $299/mo | Unlimited trades + jobs + SMS, API, weather windows |

## TECH DECISIONS

- **Auth**: Clerk (multi-tenant, RBAC-ready)
- **Database**: Convex (real-time, serverless, TypeScript-native)
- **Weather APIs**: Tomorrow.io (primary) + OpenWeatherMap (fallback)
- **Notifications**: Twilio (SMS) + SendGrid (email)
- **LLM**: Ollama (local, free, privacy-first)
- **Orchestration**: Claude Code Agent Server (custom Node.js, replaces n8n)
- **Payments**: Stripe (subscription billing per tier)

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
OLLAMA_BASE_URL=http://localhost:11434
AGENT_WEBHOOK_URL=
AGENT_SHARED_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## CRITICAL RULES

1. **Never skip a phase.** Each phase builds on the previous. Run `/project-status` to verify.
2. **Never deploy without Phase 8.** Security audit is mandatory before shipping.
3. **Never hardcode business logic.** Weather rules, trade presets, and thresholds live in the database.
4. **Never call Ollama without a fallback.** Template-based notifications must always work.
5. **Never expose API keys client-side.** All external API calls go through Convex actions or server routes.
6. **Always filter by businessId.** Multi-tenant isolation is non-negotiable.
