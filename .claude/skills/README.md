# Rain Check Skills Directory

Operational knowledge specialists for Rain Check weather scheduling. These skills encode the exact domain patterns, thresholds, and conventions that make Rain Check work — they are not generic tools but deep institutional knowledge.

## Skills

| Skill | Specialist | Triggers On |
|---|---|---|
| [`convex-engineer`](./convex-engineer/SKILL.md) | Convex Backend Patterns | Writing queries/mutations/actions, schema changes, tenant isolation, Convex HTTP API |
| [`weather-ops`](./weather-ops/SKILL.md) | Weather Operations | Forecast interpretation, trade thresholds, rule evaluation, weather API debugging |
| [`schedule-optimizer`](./schedule-optimizer/SKILL.md) | Schedule Optimization | Job rescheduling, clear-day finding, weather windows, bulk operations |
| [`contractor-comms`](./contractor-comms/SKILL.md) | Contractor Communications | Notifications, SMS/email templates, notification chains, tone calibration |
| [`revenue-protector`](./revenue-protector/SKILL.md) | Revenue Impact & Billing | Revenue calculations, Stripe billing, pricing tiers, dashboard stats |
| [`agent-terminal`](./agent-terminal/SKILL.md) | Agent Terminal Infrastructure | VPS server, Traefik routing, session management, CLI execution, SSE streaming |

## Architecture

- **Location**: `.claude/skills/` (project-level, git-tracked)
- **Discovery**: Claude auto-discovers skills by scanning the directory
- **Format**: Each skill is a `SKILL.md` file with trigger conditions, encoded knowledge, and MCP integration references
- **Relationship to Commands**: Commands (`.claude/commands/`) are build-phase agents (sequential phases 0-9). Skills are operational knowledge (reusable across sessions).

## MCP Integrations by Skill

| MCP Server | Used By | Operations |
|---|---|---|
| Stripe | revenue-protector | Subscriptions, invoices, pricing, balance |
| Google Calendar | schedule-optimizer | Availability checks, conflict detection |
| Gmail | contractor-comms | Draft/test emails, search sent notifications |
| Canva | contractor-comms | Branded weather report visuals |
| GitHub | convex-engineer, agent-terminal | PR review, deploy coordination |
| Brave Search | weather-ops | Research trade-specific thresholds |
| Firecrawl | weather-ops | Deep-scrape industry forums for threshold validation |
| Notion | revenue-protector | Document pricing changes, client SOPs |
| Supabase | convex-engineer | Analytics fallback only |
| Sequential Thinking | agent-terminal | Debug complex session lifecycle issues |
