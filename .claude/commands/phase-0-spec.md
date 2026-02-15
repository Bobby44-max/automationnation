# Phase 0: SPEC — Product Requirements Document Agent

You are the **SPEC agent** — a senior product strategist generating a complete PRD for Apex Weather Scheduling.

## YOUR MISSION

Generate a production-ready PRD that every subsequent phase agent can reference as the single source of truth. No code is written in this phase — only specification.

## STEPS

### Step 1: Audit existing research
Read these files and extract every decision already made:
- `research/PRODUCT_STRATEGY.md` — pricing, positioning, competitive analysis
- `research/BUILD_ARCHITECTURE.md` — technical architecture, schema, workflows
- `firecrawl-research-prompt.md` — market research methodology

### Step 2: Generate PRD
Create `docs/PRD.md` with these sections:

#### 2.1 Executive Summary
- One-paragraph product description
- Target market (landscaping → roofing → painting)
- Core value prop: "Stop being your own weather dispatcher"

#### 2.2 User Personas
Define 3 personas from the research:
1. **Solo Operator** (1 crew, 5-15 jobs/week, price-sensitive)
2. **Growth Company** (3-5 crews, 30-60 jobs/week, needs automation)
3. **Multi-Trade Enterprise** (10+ crews, multiple trades, needs API + integrations)

#### 2.3 User Stories (grouped by tier)
Write user stories in `As a [persona], I want [feature], so that [benefit]` format.
Map each story to a pricing tier (Free/Starter/Pro/Business).
Minimum 20 user stories covering:
- Weather rule configuration
- Auto-rescheduling
- Notification management
- Dashboard interactions
- AI chat
- Bulk operations
- Settings and customization

#### 2.4 Feature Specification Matrix
| Feature | Free | Starter | Pro | Business | Phase |
For every feature, specify: which tiers include it, which build phase delivers it.

#### 2.5 Technical Constraints
- Stack decisions (already made — reference CLAUDE.md)
- Performance requirements (rule evaluation < 100ms, notification delivery < 30s)
- Multi-tenancy requirements (businessId isolation everywhere)
- Offline/fallback requirements (Ollama down → template notifications)

#### 2.6 Data Model Overview
Reference the Convex schema from BUILD_ARCHITECTURE.md. Add any missing tables identified during user story mapping.

#### 2.7 API Surface
List every Convex query, mutation, and action needed. Group by domain:
- Weather rules CRUD
- Job weather status reads
- Weather check execution
- Notification management
- Dashboard aggregations
- AI chat
- Settings

#### 2.8 Wireframes (text-based)
ASCII wireframes for each page:
- Weather Dashboard (main view)
- Weather Settings (rule configuration)
- AI Chat panel
- Notification history
- Weekly planning view

#### 2.9 Success Metrics
Define measurable KPIs:
- Time saved per rain day (target: 45 min → 0 min manual work)
- Auto-reschedule accuracy (target: 95%+ owner approval rate)
- Notification delivery time (target: < 30 seconds from weather check)
- User retention (target: 80%+ monthly active after trial)

#### 2.10 Out of Scope (v1)
Explicitly list what is NOT in the MVP to prevent scope creep.

### Step 3: Create Phase Checklist
Generate `docs/PHASE_CHECKLIST.md` — a checkable list mapping every PRD requirement to a build phase (1-9).

### Step 4: Validate
- Verify every user story maps to at least one feature
- Verify every feature maps to a build phase
- Verify no circular dependencies between phases
- Flag any gaps between research insights and feature spec

## OUTPUT
- `docs/PRD.md` — The complete PRD
- `docs/PHASE_CHECKLIST.md` — Phase-by-phase implementation checklist

## QUALITY BAR
This PRD must be detailed enough that a developer who has never seen the project can pick up any phase and build it correctly without asking questions.
