# Firecrawl Master Research Prompt — Weather-Based Scheduling for Service Businesses

## Objective

Scrape, extract, and synthesize information to understand what weather-dependent service businesses **actually need, currently pay for, and are underserved on** regarding weather-based job scheduling, crew dispatch, and operational automation.

---

## PROMPT (use as your Firecrawl extraction/LLM prompt)

```
You are a market research analyst investigating weather-based scheduling and automation tools for field service businesses. For every page you process, extract and categorize the following:

### 1. INDUSTRY PAIN POINTS
- What specific problems do service businesses describe related to weather and scheduling?
- What manual processes do they complain about (e.g., checking forecasts, calling crews, rescheduling clients)?
- What revenue/profit losses do they attribute to weather disruptions?
- What phrases or keywords do they use to describe these problems in their own words?

### 2. EXISTING SOLUTIONS & COMPETITORS
- What tools/software are mentioned for weather-based scheduling?
- What features do these tools advertise?
- What pricing models do they use (per user/month, per job, flat rate, tiered)?
- What do users complain about in reviews (missing features, UX issues, integration gaps)?
- What integrations do they support (CRM, calendar, SMS, weather APIs)?

### 3. BUYING SIGNALS & WILLINGNESS TO PAY
- What features do businesses say they would pay for?
- What ROI claims do existing vendors make?
- What budget range do service businesses typically allocate for scheduling software?
- Are there quotes or testimonials about time/money saved?

### 4. WORKFLOW & OPERATIONAL PATTERNS
- How do businesses currently decide to cancel/reschedule/proceed with a job based on weather?
- Who makes the decision (owner, dispatcher, crew lead)?
- What is the typical notification chain (client, crew, office)?
- What time windows matter (day-before, morning-of, real-time)?
- What weather thresholds matter per trade (wind speed for roofing, rain for painting, temp for concrete)?

### 5. INDUSTRY-SPECIFIC NEEDS (extract per vertical)
For each service type found, note unique requirements:
- Landscaping & lawn care
- Roofing & exterior construction
- Painting (exterior)
- Concrete & masonry
- Power washing / pressure washing
- Pool service & maintenance
- Pest control
- HVAC (seasonal demand spikes)
- Tree service / arborist
- Solar panel installation
- Event setup / tent & rental companies
- Agricultural services
- Paving & sealcoating
- Window cleaning (commercial/residential)
- Gutter installation & cleaning

### 6. FEATURE WISHLIST (what people ask for but can't find)
- Auto-rescheduling based on weather thresholds
- Client auto-notification (SMS/email) when weather triggers a change
- Crew notification and re-dispatch
- Multi-day weather lookahead with confidence scoring
- Integration with existing FSM tools (Jobber, ServiceTitan, Housecall Pro, etc.)
- Revenue impact forecasting ("you'll lose $X if you don't reschedule")
- Weather windows optimization ("best 3-hour window this week for exterior paint")
- Bulk reschedule for multi-crew operations
- Map-based weather overlay with job pins
- Historical weather pattern analysis for seasonal planning

### 7. PRICING & PACKAGING INTELLIGENCE
- What do similar SaaS tools charge?
- What tier structure works (solo operator vs. 5-crew company vs. enterprise)?
- Are there usage-based models (per weather check, per auto-reschedule)?
- What's the perceived value vs. cost threshold?

OUTPUT FORMAT:
Return structured JSON with these 7 categories as top-level keys. Under each key, return an array of findings. Each finding should include:
- "insight": the extracted information
- "source_context": brief description of where this came from on the page
- "confidence": high/medium/low
- "relevant_trades": array of service types this applies to
- "quotable": true/false (is this a direct quote from a business owner or user?)
```

---

## TARGET URLs & DOMAINS TO CRAWL

### Competitor & Tool Pages
- https://www.jobber.com (scheduling features, weather mentions)
- https://www.servicetitan.com (enterprise FSM, weather features)
- https://www.housecallpro.com (small biz FSM)
- https://www.fieldedge.com
- https://www.workiz.com
- https://www.zuper.co
- https://www.connecteam.com
- https://www.kickserv.com
- https://www.fieldpulse.com
- https://www.gorilladesk.com (lawn/pest specific)
- https://www.lawnpro.com
- https://www.yardbook.com
- https://www.copilot.com (service business automation)

### Review & Comparison Sites
- https://www.g2.com/categories/field-service-management
- https://www.capterra.com/field-service-management-software/
- https://www.getapp.com/operations-management-software/field-service/
- https://www.trustradius.com/field-service-management-fsm
- https://www.softwareadvice.com/field-service/

### Forums & Community (real user language)
- https://www.reddit.com/r/sweatystartup/
- https://www.reddit.com/r/landscaping/
- https://www.reddit.com/r/roofing/
- https://www.reddit.com/r/pressurewashing/
- https://www.reddit.com/r/smallbusiness/
- https://www.reddit.com/r/contractor/
- https://www.reddit.com/r/lawncare/
- https://www.lawnsite.com/forums/ (LawnSite forums)
- https://www.contractortalk.com/forums/
- https://www.painttalk.com/forums/

### Industry Publications & Blogs
- https://www.fieldservicenews.com
- https://www.servicemax.com/blog
- https://www.landscapeprofessionals.org (NALP)
- https://www.nrca.net (National Roofing Contractors Association)
- https://www.pdca.org (Painting & Decorating Contractors of America)

### Weather API / Data Providers (understand the supply side)
- https://www.tomorrow.io (weather API for business)
- https://openweathermap.org/api
- https://www.weatherapi.com
- https://www.visualcrossing.com
- https://developer.accuweather.com

---

## SEARCH QUERIES TO SEED ADDITIONAL CRAWLING

Use these as Firecrawl search-and-scrape seeds:

```
"weather based scheduling software service business"
"automatic reschedule rain forecast landscaping"
"weather cancellation policy contractor"
"field service management weather integration"
"how do roofers handle rain delays"
"painting contractor weather scheduling"
"concrete pour weather requirements automation"
"pressure washing rain cancellation"
"service business weather lost revenue"
"jobber weather" OR "servicetitan weather" OR "housecall pro weather"
"weather scheduling automation API"
"best weather API for field service"
"weather threshold roofing wind speed"
"landscape crew dispatch weather"
"automated client notification weather reschedule"
"service business scheduling pain points"
"field service scheduling challenges 2024 2025"
"weather dependent business automation"
site:reddit.com "weather" "scheduling" "service business"
site:reddit.com "rain" "reschedule" "clients" "lawn" OR "roofing" OR "painting"
```

---

## POST-PROCESSING ANALYSIS

After all pages are crawled and extracted, synthesize a final report covering:

### A. Market Gap Analysis
- What do ALL competitors lack that businesses clearly want?
- Where is the biggest gap between "what exists" and "what's needed"?

### B. Ideal Feature Set (MVP)
- Top 10 features ranked by demand frequency and revenue impact
- Must-have vs. nice-to-have classification

### C. Pricing Strategy Recommendation
- What price point hits the sweet spot for solo operators vs. multi-crew?
- What metric should pricing be based on (users, jobs, locations, weather checks)?

### D. Go-To-Market Hooks
- What language/phrases resonate most with service business owners?
- What's the #1 pain point that would make someone switch tools?
- What's the "aha moment" — the feature demo that sells itself?

### E. Trade-Specific Requirement Matrix
| Trade | Key Weather Vars | Threshold Examples | Scheduling Pattern | Notification Need |
|-------|-----------------|-------------------|-------------------|------------------|
| Roofing | Wind, Rain, Temp | >25mph wind, >30% rain | Day-before + morning-of | Crew + Client |
| Painting | Rain, Humidity, Temp | >50% humidity, <50°F | 48hr lookahead | Client + Crew |
| ... | ... | ... | ... | ... |

---

## NOTES FOR EXECUTION

- **Depth**: Crawl up to 3 levels deep on competitor sites (homepage → features → pricing/integrations)
- **Rate limiting**: Respect robots.txt, use 2-3 second delays between requests
- **Dedup**: Many forums will have overlapping complaints — deduplicate by insight, keep the most quotable version
- **Freshness**: Prioritize content from 2023-2025 for market relevance
- **Volume target**: Aim for 200+ unique insights across all 7 categories
