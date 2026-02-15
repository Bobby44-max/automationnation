# Apex Weather Scheduling — Build Architecture

> Using: Ollama (local LLM) + n8n (orchestration) + Convex (backend) + Next.js (UI)
> Goal: Fastest path to working product that service businesses will pay for

---

## THE CORE PRINCIPLE: LLM WHERE IT MATTERS, DETERMINISTIC WHERE IT DOESN'T

The weather engine itself does NOT need AI. It's math:
- `if (wind_speed >= 25) → cancel`
- `if (humidity >= 85) → cancel`

That's a rule engine. Deterministic. Fast. Reliable. Never hallucinates.

**Ollama's job** is the intelligence layer ON TOP:
- Generate human-readable notifications ("Your paint job was moved because humidity would add 4 hours to dry time")
- Power the owner's dashboard AI assistant ("Should I send crews out tomorrow?")
- Interpret edge cases where multiple weather variables interact
- Generate weekly weather planning summaries

---

## ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                          │
│         WeatherSchedulingClient.tsx + Dashboard              │
│    (Owner sees: job cards, weather status, AI chat)          │
└───────────────┬──────────────────────────┬───────────────────┘
                │ Convex queries/mutations │
                ▼                          ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│      CONVEX BACKEND      │  │     OLLAMA (LOCAL, D: DRIVE)   │
│  weatherScheduling.ts    │  │  ┌──────────────────────────┐  │
│  - weatherRules table    │  │  │  ~3B-7B Model            │  │
│  - weatherChecks table   │  │  │  • Notification text gen │  │
│  - weatherActions table  │  │  │  • AI chat assistant     │  │
│  - jobWeatherStatus      │  │  │  • Weekly summaries      │  │
│  - weatherWindows        │  │  │  • Edge case reasoning   │  │
│                          │  │  └──────────────────────────┘  │
└───────────┬──────────────┘  └──────────┬─────────────────────┘
            │                            │
            ▼                            │
┌──────────────────────────────────────────────────────────────┐
│                     N8N ORCHESTRATOR                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Cron: 5 AM  │  │ Weather API  │  │ AIF Executor        │ │
│  │ Daily check │→ │ Fetch forecast│→ │ Run rule engine     │ │
│  └─────────────┘  └──────────────┘  │ per job per trade   │ │
│                                      └──────────┬──────────┘ │
│                    ┌────────────────────────────┐│           │
│                    │  Decision Router            ││           │
│                    │  GREEN → log, proceed       │◄───────── │
│                    │  YELLOW → warn crew lead    │            │
│                    │  RED → auto-reschedule      │            │
│                    │        + notify all          │            │
│                    └────────────────────────────┘            │
│                              │                               │
│              ┌───────────────┼───────────────┐               │
│              ▼               ▼               ▼               │
│        ┌──────────┐  ┌────────────┐  ┌─────────────┐        │
│        │ Twilio   │  │ SendGrid   │  │ Ollama Call  │        │
│        │ SMS      │  │ Email      │  │ (gen message)│        │
│        └──────────┘  └────────────┘  └─────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## BUILD ORDER (4 Phases)

### PHASE 1: The Engine (Week 1) — No AI, Pure Logic
**This is what makes money. Ship this first.**

#### 1A. Weather API Integration (n8n workflow)
```
n8n workflow: "weather-check-daily"
├── Trigger: Cron 5:00 AM local time
├── Node 1: HTTP Request → Tomorrow.io API (or OpenWeatherMap)
│   GET /v4/timelines?location={zip}&fields=temperature,humidity,
│       windSpeed,precipitationProbability,dewPoint
│   → Returns hourly forecast for next 48hrs
├── Node 2: Split by job location (from Convex query)
│   → Each job gets its own weather data for its zip code
├── Node 3: Function node — RULE ENGINE
│   → Load trade preset for this job
│   → Evaluate each rule against forecast
│   → Output: { jobId, status: "green"|"yellow"|"red", reasons[] }
├── Node 4: Convex mutation — update jobWeatherStatus
└── Node 5: Router based on status
    ├── GREEN → done
    ├── YELLOW → send warning (template SMS)
    └── RED → trigger reschedule sub-workflow
```

#### 1B. Rule Engine (pure JavaScript in n8n Function node)
```javascript
// This runs in n8n Function node — no LLM needed
function evaluateWeatherRules(forecast, tradePreset) {
  const results = [];

  for (const rule of tradePreset.rules) {
    const forecastValue = forecast[rule.variable];
    let triggered = false;

    switch (rule.operator) {
      case '>=': triggered = forecastValue >= rule.value; break;
      case '<=': triggered = forecastValue <= rule.value; break;
      case '>':  triggered = forecastValue > rule.value; break;
      case '<':  triggered = forecastValue < rule.value; break;
    }

    if (triggered) {
      results.push({
        action: rule.action,       // "cancel", "warn", "reschedule_route"
        reason: rule.reason,       // "Wind speed 28mph exceeds 25mph safety limit"
        variable: rule.variable,
        actual: forecastValue,
        threshold: rule.value
      });
    }
  }

  // Worst action wins
  const hasCancel = results.some(r => r.action === 'cancel' || r.action === 'reschedule_route');
  const hasWarn = results.some(r => r.action === 'warn');

  return {
    status: hasCancel ? 'red' : hasWarn ? 'yellow' : 'green',
    triggered_rules: results,
    recommendation: hasCancel ? 'reschedule' : hasWarn ? 'proceed_with_caution' : 'proceed'
  };
}
```

#### 1C. Auto-Reschedule Logic (n8n sub-workflow)
```
n8n workflow: "find-next-clear-day"
├── Input: jobId, trade, location, triggered_rules
├── Node 1: Fetch 7-day hourly forecast for location
├── Node 2: Function — scan each day
│   → For each day, run rule engine against ALL trade rules
│   → Find first day where ALL rules pass for work window (8AM-5PM)
│   → Return: { newDate, weatherSummary, confidence }
├── Node 3: Convex mutation — move job to newDate
├── Node 4: Log the action in weatherActions table
└── Node 5: Trigger notification workflow
```

#### 1D. Notification (template-based, no AI yet)
```
n8n workflow: "send-weather-notification"
├── Input: jobId, action, reasons[], newDate, recipients[]
├── Node 1: Build message from template
│   Template: "Weather update for {date}: {reason}.
│              Your appointment has been moved to {newDate}."
├── Node 2: Split by recipient type
│   ├── Client → Twilio SMS + SendGrid email
│   ├── Crew Lead → Twilio SMS
│   └── Office → Internal webhook / Convex mutation
└── Node 3: Log in weatherActions
```

### PHASE 2: The Dashboard (Week 2)

#### 2A. WeatherSchedulingClient.tsx — Main View
```
┌─────────────────────────────────────────────────────┐
│  TODAY: Thursday, March 14          [Rain Day Mode] │
│  ─────────────────────────────────────────────────  │
│  4 jobs rescheduled · 8 proceeding · $0 revenue lost│
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 🟢 8 AM │ │ 🟢 9 AM │ │ 🔴10 AM │ │ 🟡11 AM │  │
│  │ Johnson │ │ Garcia  │ │ Williams│ │ Park    │  │
│  │ Interior│ │ Mowing  │ │ Roof ██ │ │ Paint   │  │
│  │ HVAC    │ │ Crew B  │ │→ Mon 3/18│ │ Watch   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                     │
│  WEATHER: 58°F · Wind 22mph · Rain 75% · Hum 82%  │
│  ███████████░░░░░░░ Rain expected 10AM-3PM          │
│                                                     │
│  [Notify All Clients] [Override: Send Crews] [Chat] │
└─────────────────────────────────────────────────────┘
```

**Key components:**
- Job cards with color-coded weather status (green/yellow/red)
- Today's weather bar with hourly rain probability
- Bulk action buttons (Notify All, Override)
- Quick stats (jobs rescheduled, proceeding, revenue impact)

#### 2B. Convex Schema (weatherScheduling.ts)
```typescript
// Tables needed in Convex
export const weatherRules = defineTable({
  businessId: v.string(),
  trade: v.string(),             // "roofing", "exterior_painting", "landscaping"
  rules: v.array(v.object({
    variable: v.string(),        // "wind_speed_mph", "humidity_pct", etc.
    operator: v.string(),        // ">=", "<=", ">", "<"
    value: v.number(),
    action: v.string(),          // "cancel", "warn", "reschedule_route"
    reason: v.string(),
  })),
  checkTimes: v.array(v.string()),         // ["05:00", "06:30"]
  notificationChain: v.array(v.string()),  // ["crew_lead", "client", "office"]
  isDefault: v.boolean(),                  // true = our preset, false = custom
});

export const jobWeatherStatus = defineTable({
  jobId: v.string(),
  businessId: v.string(),
  date: v.string(),
  status: v.string(),            // "green", "yellow", "red"
  triggeredRules: v.array(v.object({
    variable: v.string(),
    actual: v.number(),
    threshold: v.number(),
    reason: v.string(),
  })),
  lastChecked: v.number(),       // timestamp
  autoRescheduled: v.boolean(),
  newDate: v.optional(v.string()),
});

export const weatherActions = defineTable({
  jobId: v.string(),
  businessId: v.string(),
  actionType: v.string(),        // "rescheduled", "notified", "overridden"
  fromDate: v.string(),
  toDate: v.optional(v.string()),
  reason: v.string(),
  notificationsSent: v.number(),
  revenueProtected: v.optional(v.number()),
  timestamp: v.number(),
});

export const weatherWindows = defineTable({
  businessId: v.string(),
  location: v.string(),          // zip code
  trade: v.string(),
  windows: v.array(v.object({
    date: v.string(),
    startHour: v.number(),
    endHour: v.number(),
    confidence: v.number(),      // 0-100
    conditions: v.object({
      avgTemp: v.number(),
      avgHumidity: v.number(),
      maxWind: v.number(),
      rainProb: v.number(),
    }),
  })),
  generatedAt: v.number(),
});
```

### PHASE 3: Ollama Intelligence Layer (Week 3)

**NOW Ollama earns its keep.** The deterministic engine is running. Ollama makes it smart.

#### 3A. Smart Notifications via Ollama
```
n8n workflow: "generate-smart-notification"
├── Input: job details, weather data, triggered rules, trade
├── Node 1: HTTP Request → Ollama API (localhost:11434)
│   POST /api/generate
│   {
│     "model": "your-model-name",
│     "prompt": "You are a scheduling assistant for a {trade} company.
│       Generate a SHORT, professional SMS (under 160 chars) to notify
│       a client about a weather reschedule.
│
│       Original date: {date}
│       New date: {newDate}
│       Reason: {reasons}
│       Client name: {clientName}
│
│       Be specific about the weather reason. Be friendly.
│       Do NOT use emojis. Do NOT apologize excessively.",
│     "stream": false
│   }
├── Node 2: Validate output (length check, content filter)
├── Node 3: Send via Twilio
└── Fallback: If Ollama is down → use template string (Phase 1 style)
```

**Example Ollama output:**
> "Hi Sarah, we're moving your exterior paint job from Thursday to Monday. Tomorrow's humidity (85%) would prevent proper curing. Monday looks ideal at 45% humidity. Same time, 9 AM."

vs. template:
> "Weather update: Your appointment on 3/14 has been moved to 3/18 due to weather conditions."

**The Ollama version is why people stay subscribed.**

#### 3B. Dashboard AI Chat
```
n8n workflow: "weather-ai-chat" (webhook trigger)
├── Input: owner's question + today's weather + today's jobs
├── Node 1: Build context prompt
│   "You are a weather scheduling advisor for a {trade} business.
│    Today's forecast: {weatherJSON}
│    Today's jobs: {jobsJSON}
│    Trade rules: {rulesJSON}
│
│    Owner asks: {question}
│
│    Give a direct, actionable answer. Reference specific jobs by
│    client name. Include specific weather numbers."
├── Node 2: Ollama generate
└── Node 3: Return to frontend via Convex
```

**Example conversation:**
> **Owner:** "Can I send the Garcia crew to the Williams roof job this afternoon?"
>
> **AI:** "I wouldn't. Wind is forecasted at 28mph by 2 PM, above your 25mph safety limit. It drops to 15mph by Saturday morning. I'd move Williams to Saturday 8 AM and keep Garcia on their interior jobs today."

#### 3C. Weekly Weather Planning Summary (Cron: Sunday 8 PM)
```
n8n workflow: "weekly-weather-summary"
├── Trigger: Cron Sunday 8:00 PM
├── Node 1: Fetch 7-day forecast for all business locations
├── Node 2: Run rule engine against all scheduled jobs for the week
├── Node 3: Ollama generate summary
│   "Summarize this week's weather outlook for a {trade} business.
│    {forecastData}
│    {jobsAtRisk}
│    Highlight: best days to work, days to avoid, suggested moves."
├── Node 4: Send via email (SendGrid)
└── Node 5: Store in Convex for dashboard display
```

### PHASE 4: AIF Compiler Integration (Week 4)

Wire it all into your existing AIF workflow engine so the weather scheduler
becomes a reusable `.aif` workflow that any business can customize.

#### 4A. weatherScheduler.aif.ts
```typescript
export const weatherSchedulerWorkflow = {
  id: "weather-scheduler-v1",
  name: "Weather-Based Job Scheduler",
  description: "Automatically checks weather and reschedules outdoor jobs",

  triggers: [
    {
      type: "cron",
      schedule: "0 5 * * *",  // 5:00 AM daily
      timezone: "{{business.timezone}}"
    },
    {
      type: "manual",
      label: "Check Weather Now"
    },
    {
      type: "webhook",
      event: "severe_weather_alert"  // NWS alert webhook
    }
  ],

  steps: [
    {
      id: "fetch-jobs",
      type: "convex-query",
      action: "getJobsForDate",
      params: { date: "{{today}}", businessId: "{{business.id}}" }
    },
    {
      id: "fetch-weather",
      type: "weather-api",
      handler: "weather.js",
      params: {
        locations: "{{steps.fetch-jobs.uniqueZipCodes}}",
        hours: 48
      }
    },
    {
      id: "evaluate-rules",
      type: "rule-engine",
      handler: "weather.js:evaluateRules",
      forEach: "{{steps.fetch-jobs.jobs}}",
      params: {
        forecast: "{{steps.fetch-weather.byZip[item.zipCode]}}",
        tradePreset: "{{item.trade}}"
      }
    },
    {
      id: "route-decisions",
      type: "router",
      routes: [
        {
          condition: "{{item.status === 'red'}}",
          goto: "find-new-window"
        },
        {
          condition: "{{item.status === 'yellow'}}",
          goto: "send-warning"
        },
        {
          condition: "{{item.status === 'green'}}",
          goto: "log-clear"
        }
      ]
    },
    {
      id: "find-new-window",
      type: "weather-api",
      handler: "weather.js:findNextClearDay",
      params: {
        location: "{{item.zipCode}}",
        trade: "{{item.trade}}",
        scanDays: 7
      }
    },
    {
      id: "reschedule-job",
      type: "convex-mutation",
      action: "rescheduleJob",
      params: {
        jobId: "{{item.jobId}}",
        newDate: "{{steps.find-new-window.bestDate}}",
        reason: "{{steps.evaluate-rules.triggeredRules}}"
      }
    },
    {
      id: "generate-notification",
      type: "ollama",
      handler: "weather.js:generateNotification",
      params: {
        job: "{{item}}",
        reasons: "{{steps.evaluate-rules.triggeredRules}}",
        newDate: "{{steps.find-new-window.bestDate}}"
      },
      fallback: {
        type: "template",
        template: "Weather update: Your {{item.trade}} appointment on {{item.date}} has been moved to {{steps.find-new-window.bestDate}} due to weather conditions."
      }
    },
    {
      id: "send-notifications",
      type: "notification",
      handler: "weather.js:sendNotifications",
      params: {
        message: "{{steps.generate-notification.text}}",
        recipients: "{{item.notificationChain}}",
        channels: ["sms", "email"]
      }
    },
    {
      id: "log-action",
      type: "convex-mutation",
      action: "logWeatherAction",
      params: {
        jobId: "{{item.jobId}}",
        action: "{{steps.route-decisions.selectedRoute}}",
        details: "{{steps.evaluate-rules}}"
      }
    }
  ]
};
```

---

## OLLAMA SETUP — WHAT YOU NEED

### Your Current Model (~3.26 GB)
Based on the blob size, you likely have a **3B-7B parameter model** (possibly Llama 3.2 3B
at higher quantization, or a 7B at Q4). Check with:
```bash
ollama list
```

### Recommended Model for This Use Case
For generating SMS-length notifications and short advisory responses, your current model
is actually fine. Smaller models excel at short, structured outputs.

If you want to upgrade later:
```bash
# Best balance of speed + quality for this use case
ollama pull llama3.2:3b          # 2.0 GB, fast, good for SMS/short text
ollama pull mistral:7b           # 4.1 GB, better reasoning for AI chat
ollama pull qwen2.5:7b           # 4.7 GB, strong at structured output
```

### Ollama API Endpoints You'll Use
```
# Generate notification text
POST http://localhost:11434/api/generate
{ "model": "your-model", "prompt": "...", "stream": false }

# Chat-style for dashboard AI
POST http://localhost:11434/api/chat
{ "model": "your-model", "messages": [...], "stream": false }

# Health check (for n8n to verify Ollama is up)
GET http://localhost:11434/api/tags
```

### Critical: Always Have a Fallback
Ollama is local. It can be slow, crash, or be unavailable. EVERY Ollama call in the
architecture has a template-based fallback:
```
if (ollama.isAvailable()) {
  message = await ollama.generate(smartPrompt);
} else {
  message = templateEngine.render(fallbackTemplate, data);
}
```
The weather ENGINE (Phase 1) never depends on Ollama. It always works.

---

## N8N WORKFLOW FILES NEEDED

```
n8n-workflows/
├── weather-check-daily.json          # Phase 1: Core 5AM cron
├── find-next-clear-day.json          # Phase 1: Reschedule sub-workflow
├── send-weather-notification.json    # Phase 1: Template notifications
├── generate-smart-notification.json  # Phase 3: Ollama-enhanced messages
├── weather-ai-chat.json              # Phase 3: Dashboard AI chat webhook
├── weekly-weather-summary.json       # Phase 3: Sunday planning email
└── severe-weather-alert.json         # Phase 4: NWS webhook handler
```

---

## API KEYS NEEDED (ENV_BLUEPRINT)

```env
# Weather Data (pick one, Tomorrow.io recommended)
TOMORROW_IO_API_KEY=           # 500 free calls/day, best hourly data
OPENWEATHERMAP_API_KEY=        # 1000 free calls/day, good fallback

# Notifications
TWILIO_ACCOUNT_SID=            # SMS
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SENDGRID_API_KEY=              # Email

# Ollama (local, no key needed)
OLLAMA_BASE_URL=http://localhost:11434

# n8n
N8N_WEBHOOK_URL=               # Your n8n instance URL

# Convex
CONVEX_DEPLOYMENT=             # Your Convex deployment
NEXT_PUBLIC_CONVEX_URL=
```

---

## TOTAL COST TO RUN (Monthly)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| Tomorrow.io | 500 calls/day (plenty for MVP) | $0 |
| OpenWeatherMap | 1000 calls/day backup | $0 |
| Twilio SMS | — | ~$0.0079/SMS × ~600 SMS/mo = ~$5 |
| SendGrid | 100 emails/day free | $0 |
| Ollama | Local, free forever | $0 (just your electricity) |
| n8n | Self-hosted free | $0 |
| Convex | Free tier: 1M function calls | $0 to start |
| **Total MVP** | | **~$5/mo** |

You're selling a $29-149/mo product that costs $5/mo to run. That's the margin.
