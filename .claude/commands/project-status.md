# Utility: Project Status — Audit Current State vs. Build Phases

You are the **PROJECT STATUS agent** — auditing the current state of the Apex Weather Scheduling build against all 10 phases.

## WHAT THIS DOES
Scans the codebase and reports which phases are complete, in-progress, or not started. Identifies blockers and next actions.

## STEPS

### Step 1: Phase 0 — SPEC
Check for:
- [ ] `docs/PRD.md` exists and is comprehensive
- [ ] `docs/PHASE_CHECKLIST.md` exists
- [ ] User personas defined
- [ ] User stories written
- [ ] Feature matrix complete

### Step 2: Phase 1 — SCAFFOLD
Check for:
- [ ] `apex-ui/package.json` with all dependencies
- [ ] `apex-ui/tsconfig.json` configured
- [ ] `apex-ui/tailwind.config.ts` configured
- [ ] `apex-ui/.env.example` documented
- [ ] Directory structure matches spec
- [ ] `npm run build` succeeds (run it)

### Step 3: Phase 2 — SCHEMA
Check for:
- [ ] `apex-ui/convex/schema.ts` — all tables present
- [ ] All tables have indexes for query patterns
- [ ] `apex-ui/lib/types.ts` — TypeScript types
- [ ] `apex-ui/convex/validators.ts` — reusable validators
- [ ] Seed data covers all tables
- [ ] `npx convex dev` deploys without errors

### Step 4: Phase 3 — AUTH
Check for:
- [ ] `apex-ui/middleware.ts` — route protection
- [ ] `apex-ui/convex/auth.ts` — auth helpers
- [ ] `apex-ui/app/(auth)/` — sign-in/sign-up pages
- [ ] `apex-ui/app/api/webhooks/clerk/route.ts`
- [ ] Every Convex function has auth check
- [ ] RBAC role hierarchy implemented

### Step 5: Phase 4 — API
Check for:
- [ ] `apex-ui/convex/weatherRules.ts` — CRUD
- [ ] `apex-ui/convex/jobs.ts` — CRUD + reschedule
- [ ] `apex-ui/convex/weatherStatus.ts` — check + evaluate
- [ ] `apex-ui/convex/weatherActions.ts` — audit log
- [ ] `apex-ui/convex/weatherWindows.ts` — optimal windows
- [ ] `apex-ui/convex/notifications.ts` — send + log
- [ ] `apex-ui/convex/aiChat.ts` — Ollama advisor
- [ ] `apex-ui/convex/business.ts` — settings
- [ ] All functions have tenant isolation

### Step 6: Phase 5 — UI
Check for:
- [ ] Console layout with sidebar
- [ ] Weather Dashboard page
- [ ] JobCardGrid + JobCard components
- [ ] WeatherStatsBar component
- [ ] WeatherStrip component
- [ ] BulkActionBar component
- [ ] AiChatPanel component
- [ ] Settings page
- [ ] All components use `useQuery`/`useMutation` (no mocks)

### Step 7: Phase 6 — INTEGRATIONS
Check for:
- [ ] Weather API integration (Tomorrow.io + OpenWeatherMap)
- [ ] Stripe checkout + webhook handler
- [ ] Twilio SMS integration
- [ ] SendGrid email integration
- [ ] Ollama integration with fallback
- [ ] n8n webhook integration
- [ ] Integration health page

### Step 8: Phase 7 — POLISH
Check for:
- [ ] Error boundaries on all pages
- [ ] Skeleton loading states
- [ ] Empty states with CTAs
- [ ] SEO metadata on marketing pages
- [ ] Accessibility (keyboard nav, ARIA labels, contrast)
- [ ] Responsive design (4 breakpoints)
- [ ] Toast notifications (Sonner)

### Step 9: Phase 8 — VALIDATE
Check for:
- [ ] `docs/SECURITY_AUDIT.md` exists
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm audit` — no critical/high vulns
- [ ] Multi-tenant isolation verified

### Step 10: Phase 9 — DEPLOY
Check for:
- [ ] Production env vars documented
- [ ] Convex deployed to prod
- [ ] Next.js deployed to hosting
- [ ] Webhooks configured (Clerk, Stripe)
- [ ] Smoke tests passed
- [ ] `docs/RUNBOOK.md` exists
- [ ] Version tagged in git

## OUTPUT FORMAT
```
APEX WEATHER SCHEDULING — BUILD STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 0: SPEC         ✓ Complete
Phase 1: SCAFFOLD     ✓ Complete
Phase 2: SCHEMA       ◐ In Progress (3/6 checks)
Phase 3: AUTH         ○ Not Started
Phase 4: API          ○ Not Started
Phase 5: UI           ◐ In Progress (existing components)
Phase 6: INTEGRATIONS ○ Not Started
Phase 7: POLISH       ○ Not Started
Phase 8: VALIDATE     ○ Not Started
Phase 9: DEPLOY       ○ Not Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: 15% complete
Next action: Complete Phase 2 SCHEMA
Blockers: None identified
```
