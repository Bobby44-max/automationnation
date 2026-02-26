# Apex AI Weather Scheduling — Product Strategy

> Synthesized from Firecrawl market research across competitor sites, trade forums
> (r/roofing, r/lawncare, ContractorTalk, PaintTalk, LawnSite), FSM review platforms,
> and industry associations (NRCA, PDCA, NALP).

---

## 1. THE MARKET GAP (Why This Wins)

### What every competitor does:
- Generic scheduling + dispatching
- Basic automation triggers (job created → send SMS)
- Route optimization
- Some show weather data on a dashboard

### What ZERO competitors do well:
| Gap | Who Suffers | Why It Matters |
|-----|-------------|----------------|
| **Trade-specific weather thresholds** that auto-trigger actions | All exterior trades | A roofer cares about wind; a painter cares about dew point. Generic "rain alert" is useless |
| **Auto-reschedule engine** that moves jobs to the next viable window | Multi-crew operations (3+ crews) | Owner spends 5-7 AM every rain day manually shuffling 20+ jobs |
| **Impact-based alerts** (not just raw weather data) | Painters, concrete, chemical applicators | "85% humidity means 6hr dry time instead of 2hr" is actionable. "85% humidity" alone is not |
| **One-click route-wide client notification** | Landscaping/lawn care with 15-30 daily stops | Currently done via personal texts or Jobber's generic system that doesn't explain *why* |
| **Weather window optimization** ("best 3hr block this week") | Any trade with a backlog of weather-sensitive jobs | Nobody offers this. Owners eyeball 10-day forecasts manually |

**LawnPro** is the closest — they have weather-based routing on rain delay days. But it's lawn-only and surface-level (rain yes/no). No threshold customization, no multi-variable logic, no auto-reschedule.

**Zuper** shows weather in the scheduler but doesn't act on it. Display-only.

---

## 2. MVP FEATURE SET (Ranked by Research Demand)

### Tier 1 — Must Ship (these sell the product)

| # | Feature | Why It's #1 | Maps to AIF Step |
|---|---------|-------------|------------------|
| 1 | **Trade-specific weather rule engine** | Every forum thread is owners describing *their* thresholds. No tool lets them set "IF wind > 25mph AND trade = roofing THEN hold" | `weatherScheduler.aif.ts` → condition nodes |
| 2 | **Auto-reschedule to next viable window** | The single most requested feature across all verticals. "Just move it to the next good day" | `weatherScheduler.aif.ts` → reschedule action node |
| 3 | **Client + crew auto-notification** | "I need to text 20 people at 5 AM" is the universal pain point | `weather.js` step handler → SMS/email integration |
| 4 | **Morning-of decision engine** (5-7 AM auto-check) | Matches the real operational pattern — final go/no-go at dawn | `aifExecutor.js` → scheduled cron trigger |
| 5 | **Dashboard with today's weather vs. today's jobs** | Table stakes — every job shows green/yellow/red based on conditions | `WeatherSchedulingClient.tsx` |

### Tier 2 — Differentiation (these keep customers)

| # | Feature | Unique Value |
|---|---------|-------------|
| 6 | **Weather window finder** — "best 3hr block for exterior paint this week" | Nobody has this. Uses multi-variable forecast (temp + humidity + dew point + rain) |
| 7 | **Impact-based alerts** — "humidity will add 4hrs to dry time" not just "humidity is 85%" | Translates raw weather into trade-specific operational impact |
| 8 | **Radar overlay on job map** | Native radar + job pins. Currently owners alt-tab to Weather.com |
| 9 | **Bulk route actions** — one-click rain delay for entire day's route | Landscapers with 15-30 daily stops need this desperately |
| 10 | **Revenue impact score** — "rescheduling today saves $2,400 in rework risk" | Justifies the subscription cost with every use |

### Tier 3 — Future Moat

- Historical weather pattern analysis for seasonal crew planning
- AI-suggested optimal scheduling across multi-week backlogs
- Integration with material suppliers (concrete delivery, paint shipment timing)
- Soil temperature monitoring for lawn care chemical application timing

---

## 3. WEATHER THRESHOLD PRESETS (Ship These Day One)

These are the real numbers from trade forums and industry associations. Pre-load these as templates users can customize:

### Roofing
```json
{
  "trade": "roofing",
  "rules": [
    { "variable": "wind_speed_mph", "operator": ">=", "value": 25, "action": "cancel", "reason": "Safety — materials become projectiles" },
    { "variable": "wind_speed_mph", "operator": ">=", "value": 20, "action": "warn", "reason": "Caution — difficult working conditions" },
    { "variable": "rain_probability_pct", "operator": ">=", "value": 70, "action": "cancel", "reason": "Water intrusion risk during tear-off" },
    { "variable": "rain_probability_pct", "operator": ">=", "value": 40, "action": "warn", "reason": "Monitor — may need to tarp" },
    { "variable": "temperature_f", "operator": "<=", "value": 40, "action": "cancel", "reason": "Shingles won't seal — adhesive strip failure" }
  ],
  "check_times": ["05:00", "06:30"],
  "notification_chain": ["crew_lead", "office", "client"]
}
```

### Exterior Painting
```json
{
  "trade": "exterior_painting",
  "rules": [
    { "variable": "humidity_pct", "operator": ">=", "value": 85, "action": "cancel", "reason": "Coating will not dry/cure properly" },
    { "variable": "humidity_pct", "operator": ">=", "value": 70, "action": "warn", "reason": "Extended dry time — plan accordingly" },
    { "variable": "temperature_f", "operator": "<=", "value": 50, "action": "cancel", "reason": "Below minimum application temp (standard coatings)" },
    { "variable": "temperature_f", "operator": "<=", "value": 35, "action": "cancel", "reason": "Below minimum even for low-temp formulations" },
    { "variable": "dew_point_spread_f", "operator": "<=", "value": 5, "action": "cancel", "reason": "Condensation risk — surface temp too close to dew point" },
    { "variable": "rain_probability_pct", "operator": ">=", "value": 50, "action": "cancel", "reason": "Rain will wash uncured coating" }
  ],
  "check_times": ["05:00", "06:00"],
  "notification_chain": ["crew_lead", "client", "office"],
  "post_conditions": {
    "dry_time_hours_added_per_10pct_humidity_above_60": 1.5
  }
}
```

### Landscaping / Lawn Care
```json
{
  "trade": "landscaping",
  "rules": [
    { "variable": "rain_probability_pct", "operator": ">=", "value": 60, "action": "reschedule_route", "reason": "Wet grass clumps, ruts in soft ground" },
    { "variable": "temperature_f", "operator": ">=", "value": 80, "action": "warn", "reason": "Cool-season grass stress — raise mow height" },
    { "variable": "wind_speed_mph", "operator": ">=", "value": 15, "action": "cancel_chemical", "reason": "Spray drift — chemical application unsafe" },
    { "variable": "soil_temperature_f", "operator": ">=", "value": 55, "action": "trigger_preemergent", "reason": "Pre-emergent window closing — apply now" }
  ],
  "check_times": ["05:00"],
  "notification_chain": ["crew_lead", "all_route_clients"],
  "bulk_actions": true
}
```

---

## 4. PRICING STRATEGY

### Competitive Landscape
| Tool | Price | Model |
|------|-------|-------|
| Yardbook | Free – $35/mo | Freemium |
| LawnPro | $29 – $97/mo | Per-tier |
| Jobber | $35 – $499/mo | Per-tier (user count) |
| Housecall Pro | $49+/mo | Per-tier |
| GorillaDesk | $49 – $99/mo | Per-tier |
| Workiz | $199 – $599/mo | Per-tier |
| ServiceTitan | $$$ | Enterprise, contact sales |
| Zuper | $20-30/user/mo | Per-user |

### Recommended Pricing (Weather Scheduling as a focused product)

**Position: Not a full FSM replacement. A weather automation layer that plugs into what they already use.**

This is critical — don't compete with Jobber/ServiceTitan on scheduling. Be the **weather brain** that connects to them.

| Tier | Name | Price | Target | Includes |
|------|------|-------|--------|----------|
| Trial | **14-Day Trial** | $0 × 14 days | All tiers, prove the value | All Solo features, 50 SMS, no credit card required |
| Solo | **Solo** | $59/mo | Solo operators, 1-2 person crews | 1 trade, 15 jobs/day, 500 SMS/mo + email, auto-reschedule, AI messages |
| Team | **Team** | $149/mo | 3-10 crew company | 3 trades, unlimited jobs, 2,000 SMS/mo, bulk route actions, radar overlay, integrations |
| Business | **Business** | $299/mo | 10+ crews, multi-trade | Unlimited everything, weather windows, revenue scoring, API access, dedicated support |

**Why this works (updated with real COGS analysis):**
- No free tier = no money pit. 14-day trial proves value, then converts or expires
- $59 covers real SMS costs ($4-5/mo COGS) with 75%+ margin at scale
- $149 is the sweet spot — businesses scaling past 3 crews pay happily when they see $47K/yr saved
- $299 captures enterprise-adjacent operations; weather windows alone justify the upgrade
- SMS included (not metered) = predictable bills for contractors who hate surprises
- Overage: $0.01/SMS after plan limit — transparent, no bill shock

**Unit Economics (at 100 customers):**
- Solo (60% of customers): 60 × $59 = $3,540/mo revenue, ~$300 COGS = **$3,240 margin**
- Team (30% of customers): 30 × $149 = $4,470/mo revenue, ~$300 COGS = **$4,170 margin**
- Business (10% of customers): 10 × $299 = $2,990/mo revenue, ~$150 COGS = **$2,840 margin**
- **Total: $11,000/mo revenue, ~$860 COGS + $112 infra = ~$10,000/mo gross margin (91%)**

---

## 5. GO-TO-MARKET HOOKS

### The Language That Resonates (from actual forum posts)

> "I check the weather at 5 AM, then spend an hour texting crews and clients"

> "Lost a whole day because the forecast changed — had 3 crews sitting"

> "My shingles didn't seal because we pushed through cold weather. $8,000 callback"

> "I need something that just moves my jobs when it's gonna rain"

### The Killer Demo (30-second "aha moment")

1. Show a calendar with 12 jobs for tomorrow
2. Overnight, rain probability jumps to 80%
3. At 5:00 AM, the system auto-checks weather
4. 4 exterior jobs get flagged red, auto-moved to Wednesday (next clear day)
5. Clients + crews get SMS: "Due to forecasted rain, your appointment has been moved to Wednesday at 9 AM"
6. Owner wakes up, opens app, sees "4 jobs auto-rescheduled. 8 jobs proceeding. $0 revenue lost."
7. **Owner didn't have to do anything.**

### The #1 Sales Line

**"Stop being your own weather dispatcher."**

### Top 3 Target Verticals (Launch Order)

1. **Landscaping / Lawn Care** — Highest volume (15-30 daily stops), most frequent weather disruptions, most active online communities, lowest switching cost, price-sensitive enough to love $29/mo
2. **Roofing** — Highest stakes per job ($5K-$30K), weather mistakes are expensive ($8K+ callbacks), strong word-of-mouth networks
3. **Exterior Painting** — Most complex weather variables (humidity + dew point + temp), highest perceived value for "impact-based" intelligence

---

## 6. AIF WORKFLOW MAPPING

How the research maps directly to your existing AIF architecture:

```
weatherScheduler.aif.ts
├── TRIGGER: Cron (5:00 AM daily) OR manual
├── STEP 1: Fetch weather forecast
│   └── weather.js step handler → Tomorrow.io / OpenWeatherMap API
├── STEP 2: Evaluate rules per job
│   └── Load trade preset → compare each rule → flag: green/yellow/red
├── STEP 3: Decision gate
│   ├── GREEN → no action, job proceeds
│   ├── YELLOW → send warning to crew lead, flag on dashboard
│   └── RED → trigger auto-reschedule flow
├── STEP 4 (RED path): Find next viable window
│   └── Scan 7-day forecast → find first day where ALL rules pass
├── STEP 5 (RED path): Execute reschedule
│   └── Update job in Convex (weatherScheduling.ts) → move to new date
├── STEP 6: Notify
│   └── SMS/email per notification_chain config
└── STEP 7: Log & score
    └── Record: jobs checked, actions taken, estimated revenue protected
```

### Key Convex Tables Needed (`weatherScheduling.ts`)

```
weatherRules        — trade presets + custom overrides per business
weatherChecks       — log of every forecast check + result
weatherActions      — log of every auto-reschedule, notification sent
weatherWindows      — cached optimal windows for the week
jobWeatherStatus    — current green/yellow/red per job
```

---

## 7. COMPETITIVE POSITIONING MATRIX

| Capability | Jobber | ServiceTitan | LawnPro | Zuper | **Apex Weather** |
|-----------|--------|-------------|---------|-------|-------------------|
| Basic scheduling | Yes | Yes | Yes | Yes | No (integration) |
| Weather display | No | No | Overlay | In scheduler | Dashboard + map |
| Trade-specific thresholds | No | No | Rain only | No | **Yes — multi-variable** |
| Auto-reschedule on weather | No | No | Rain delay routing | No | **Yes — full engine** |
| Impact-based alerts | No | No | No | No | **Yes** |
| Weather window optimization | No | No | No | No | **Yes** |
| Client auto-notification | Generic | Generic | Generic | Generic | **Weather-specific w/ reason** |
| Bulk route rain delay | No | No | Partial | No | **Yes — one click** |
| Revenue impact scoring | No | No | No | No | **Yes** |

**Translation: You own the weather automation column entirely. Nobody else is building this.**

---

## 8. RISK & MITIGATION

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Jobber/ServiceTitan builds weather features | Medium (12-18mo) | Move fast, build integration moat — be the layer THEY integrate with |
| Weather API costs at scale | Low-Medium | Cache aggressively, batch by zip code, use free tier of OpenWeatherMap for low plans |
| Forecast inaccuracy causes wrong reschedules | Medium | Always show confidence %, let owner override, offer "suggest only" mode |
| Small biz owners resistant to automation | Medium | Default to "suggest + confirm" not full auto. Let trust build. |
| LawnPro expands weather features | Low | They're lawn-only. Multi-trade is the moat |
