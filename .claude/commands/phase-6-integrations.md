# Phase 6: INTEGRATIONS — External Services Agent

You are the **INTEGRATIONS agent** — a senior integrations engineer wiring up all external services for Apex Weather Scheduling.

## PREREQUISITES
- Phase 4 (API): Convex functions ready for external calls
- Phase 5 (UI): Pages exist to display integration results

## YOUR MISSION
Connect every external service: weather APIs, Stripe billing, Twilio SMS, SendGrid email, Ollama LLM, and n8n orchestration. Each integration must have error handling, retries, and fallbacks.

## STEPS

### Step 1: Weather API Integration
File: `apex-ui/convex/integrations/weather.ts` (Convex action)

**Primary: Tomorrow.io**
```typescript
// fetchForecast(lat, lng, hours) → HourlyForecast[]
// - GET https://api.tomorrow.io/v4/timelines
// - Fields: temperature, humidity, windSpeed, precipitationProbability, dewPoint
// - Returns hourly data for next 48 hours
// - Rate limit: 500 calls/day (free tier)
```

**Fallback: OpenWeatherMap**
```typescript
// fetchForecastFallback(lat, lng, hours) → HourlyForecast[]
// - GET https://api.openweathermap.org/data/3.0/onecall
// - Map response to same HourlyForecast[] shape
// - Triggered when Tomorrow.io returns error or rate limit
```

**Caching layer:**
- Cache forecasts in `weatherWindows` table
- Stale after 2 hours for same location
- Batch requests by zip code (don't fetch same zip twice)

### Step 2: Stripe Integration
Files:
- `apex-ui/app/api/webhooks/stripe/route.ts` — Webhook handler
- `apex-ui/convex/integrations/stripe.ts` — Convex actions for Stripe

**Checkout flow:**
```typescript
// createCheckoutSession(businessId, plan) → { url: string }
// - Creates Stripe Checkout Session with plan pricing
// - Redirects to /settings?success=true on completion
```

**Webhook events to handle:**
- `checkout.session.completed` → Update business plan in Convex
- `customer.subscription.updated` → Sync plan changes
- `customer.subscription.deleted` → Expire to trial
- `invoice.payment_failed` → Flag account, send warning email
- `customer.subscription.created` → Start 14-day trial (no charge)

**Plan pricing (Stripe Price IDs):**
- Trial: 14-day free trial via `trial_period_days: 14` on subscription
- Solo ($59/mo): `price_solo_monthly`
- Team ($149/mo): `price_team_monthly`
- Business ($299/mo): `price_business_monthly`

**Customer portal:**
```typescript
// createPortalSession(businessId) → { url: string }
// - Allows users to manage billing, update payment method, cancel
```

### Step 3: Twilio SMS Integration
File: `apex-ui/convex/integrations/sms.ts`

```typescript
// sendSMS(to, message) → { sid: string, status: string }
// - POST to Twilio REST API
// - Validate phone number format
// - Track delivery status
// - Rate limit: Max 10 SMS per job per day (prevent loops)

// sendBulkSMS(recipients[], message) → { sent: n, failed: n }
// - Sequential sends with 100ms delay (Twilio rate limits)
// - Log each result in notifications table
```

**Message constraints:**
- Max 160 characters for single SMS
- If Ollama message exceeds 160, truncate intelligently or split

### Step 4: SendGrid Email Integration
File: `apex-ui/convex/integrations/email.ts`

```typescript
// sendWeatherEmail(to, subject, htmlBody) → { messageId: string }
// - Use SendGrid v3 Mail Send API
// - HTML template with weather details, new date, reason

// sendWeeklySummary(to, summaryData) → { messageId: string }
// - Rich HTML email with week's weather outlook
// - Color-coded day-by-day forecast
// - Jobs at risk list
```

**Email templates to create:**
- `weather-reschedule` — Client notification about job move
- `weather-warning` — Crew lead heads-up about conditions
- `weekly-summary` — Owner's weekly planning email
- `welcome` — Post-signup welcome email

### Step 5: Ollama Integration
File: `apex-ui/convex/integrations/ollama.ts`

```typescript
// generateSmartNotification(jobData, weatherData, triggeredRules) → string
// - POST http://localhost:11434/api/generate
// - System prompt: "You are a scheduling assistant for a {trade} company..."
// - Max tokens: 160 (SMS length)
// - Temperature: 0.3 (consistent, professional tone)
// - ALWAYS wrap in try/catch → fallback to template

// chatWithAdvisor(messages[], weatherContext, jobContext) → string
// - POST http://localhost:11434/api/chat
// - System prompt with today's weather + jobs + rules as context
// - Temperature: 0.5 (more creative for conversation)
// - Timeout: 30 seconds (local LLM can be slow)

// generateWeeklySummary(forecastData, jobsAtRisk) → string
// - Longer form output for email
// - Max tokens: 500
// - Temperature: 0.4

// healthCheck() → boolean
// - GET http://localhost:11434/api/tags
// - Returns false if Ollama is down
```

**Fallback templates (always available):**
```typescript
const TEMPLATES = {
  reschedule: "Weather update for {date}: {reason}. Your {trade} appointment has been moved to {newDate}. Same time: {time}.",
  warning: "Weather advisory for {date}: {reason}. Your {trade} appointment is proceeding with caution.",
  weeklySubject: "Weather Outlook: Week of {weekStart}",
};
```

### Step 6: n8n Webhook Integration
File: `apex-ui/convex/integrations/n8n.ts`

```typescript
// triggerWeatherCheck(businessId) → void
// - POST to n8n webhook URL
// - Payload: { businessId, date, callback: convexActionUrl }
// - Used for scheduled checks (5 AM cron via n8n)

// triggerBulkNotify(businessId, jobIds[]) → void
// - POST to n8n webhook URL
// - Triggers notification workflow for multiple jobs
```

### Step 7: Create integration health dashboard
File: `apex-ui/app/(console)/settings/integrations/page.tsx`

Show status of each integration:
- Weather API: Last successful call, rate limit remaining
- Stripe: Subscription status, next billing date
- Twilio: Account balance, SMS sent this month
- SendGrid: Emails sent this month
- Ollama: Online/Offline status, model loaded
- n8n: Webhook reachable/unreachable

### Step 8: Error handling & retries
Every external call must:
1. Have a timeout (weather: 10s, Ollama: 30s, SMS: 5s, email: 5s)
2. Retry transient failures (1 retry with 2s delay)
3. Log failures in a consistent format
4. Surface errors to the UI (toast notifications via Sonner)
5. Never block the critical path (weather ENGINE works without any integration)

### Step 9: Verify all integrations
- Weather API: Fetch forecast for a test zip code
- Stripe: Create test checkout session
- Twilio: Send test SMS to verified number
- SendGrid: Send test email
- Ollama: Generate test notification
- n8n: Ping webhook endpoint

## QUALITY BAR
After this phase, every external service is connected, has error handling, has a fallback, and the user can see integration health in settings. The weather engine runs end-to-end: check → evaluate → decide → notify.
