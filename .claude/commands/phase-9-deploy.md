# Phase 9: DEPLOY — Environment Variables, Ship & Smoke Test Agent

You are the **DEPLOY agent** — a senior DevOps engineer shipping Apex Weather Scheduling to production.

## PREREQUISITES
- Phase 8 (VALIDATE): Security audit passed, build clean
- All API keys ready for production

## YOUR MISSION
Configure production environment, deploy to hosting, and run smoke tests to verify everything works. After this phase, real users can sign up and use the product.

## STEPS

### Step 1: Environment Variable Audit
Verify ALL env vars are set for production:

```
# Convex (from npx convex deploy)
CONVEX_DEPLOYMENT=prod:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (production instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Weather APIs
TOMORROW_IO_API_KEY=...           (verify: 500 calls/day sufficient?)
OPENWEATHERMAP_API_KEY=...        (fallback — verify active)

# Notifications
TWILIO_ACCOUNT_SID=...            (verify: production account, not test)
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...        (verify: SMS-capable, verified)
SENDGRID_API_KEY=SG....          (verify: sender identity verified)

# Stripe (production keys)
STRIPE_SECRET_KEY=sk_live_...     (NOT sk_test_!)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Ollama
OLLAMA_BASE_URL=http://localhost:11434   (or production Ollama URL)

# n8n
N8N_WEBHOOK_URL=https://...       (production n8n instance)
```

**Critical checks:**
- [ ] No test/dev keys in production
- [ ] No keys with restricted permissions that will fail at scale
- [ ] Stripe is in live mode (not test mode)
- [ ] Clerk is using production instance
- [ ] Twilio number is verified for production SMS

### Step 2: Deploy Convex to Production
```bash
npx convex deploy --prod
```
- Verify schema deployed correctly
- Run seed data for default trade presets (not test jobs)
- Verify all functions are accessible

### Step 3: Deploy Next.js
Deploy to Vercel (recommended) or your hosting platform:

```bash
# Vercel
npx vercel --prod

# Or: Build locally and deploy
npm run build
```

**Vercel configuration:**
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables: All from Step 1
- Region: US East (closest to most service businesses)

### Step 4: Configure Webhooks (Production URLs)

**Clerk webhook:**
- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Signing secret → `CLERK_WEBHOOK_SECRET`

**Stripe webhook:**
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Signing secret → `STRIPE_WEBHOOK_SECRET`

### Step 5: DNS & Domain
- Point domain to Vercel (or hosting)
- Verify SSL certificate active
- Set up www → apex redirect (or vice versa)
- Update Clerk allowed origins
- Update Stripe webhook URL

### Step 6: Smoke Tests (Manual Checklist)

**Auth flow:**
- [ ] Sign up with new email → business created → onboarding shown
- [ ] Sign in → redirected to dashboard
- [ ] Sign out → redirected to landing page
- [ ] Access /dashboard without auth → redirected to sign-in

**Weather scheduling:**
- [ ] Dashboard loads with empty state (new user)
- [ ] Add trade preset → rules appear in settings
- [ ] Create test job → appears on dashboard
- [ ] Run weather check → job gets green/yellow/red status
- [ ] Auto-reschedule triggers for red jobs (if conditions met)

**Notifications:**
- [ ] SMS notification sends and arrives (test with real phone)
- [ ] Email notification sends and arrives (check spam folder)
- [ ] Bulk notify works for Pro+ users
- [ ] Notification appears in history

**Billing:**
- [ ] Upgrade from Free → Starter via Stripe checkout
- [ ] Stripe webhook updates plan in Convex
- [ ] Feature gates update immediately after upgrade
- [ ] Manage billing via customer portal

**AI Chat (if Ollama accessible):**
- [ ] Chat panel opens
- [ ] Question sent → response received
- [ ] Fallback message shown if Ollama unavailable

**Edge cases:**
- [ ] Invalid weather API key → graceful error, not crash
- [ ] Ollama offline → template notifications still send
- [ ] Network timeout → retry + user-friendly error
- [ ] Concurrent weather checks → no duplicate actions

### Step 7: Monitoring Setup
- [ ] Vercel Analytics enabled (or your platform's monitoring)
- [ ] Convex dashboard accessible for function monitoring
- [ ] Error tracking: Monitor Convex function failures
- [ ] Uptime monitoring: Ping /api/health every 5 minutes

### Step 8: Backup & Recovery
- [ ] Convex data export scheduled (if available)
- [ ] Git repository is clean, tagged with version
- [ ] Rollback plan documented (previous Vercel deployment)
- [ ] `.env.local` backed up securely (NOT in git)

### Step 9: Create version tag
```bash
git tag -a v1.0.0 -m "Apex Weather Scheduling v1.0.0 — Production Launch"
git push origin v1.0.0
```

### Step 10: Post-Deploy Documentation
Create `docs/RUNBOOK.md`:
- How to deploy updates
- How to rollback
- How to add new trade presets
- How to monitor health
- How to respond to incidents
- Environment variable reference

## QUALITY BAR
After this phase, the product is live. Real users can sign up, configure weather rules, see their jobs scheduled around weather, and receive smart notifications. The system handles errors gracefully and the team has a runbook for operations.

## LAUNCH CHECKLIST (Final Sign-Off)
- [ ] All smoke tests pass
- [ ] Production environment variables verified
- [ ] Webhooks receiving events
- [ ] First test user created successfully end-to-end
- [ ] Monitoring active
- [ ] Runbook written
- [ ] **SHIP IT** 🚢
