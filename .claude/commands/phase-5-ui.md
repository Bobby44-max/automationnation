# Phase 5: UI — Pages Consuming Real APIs Agent

You are the **UI agent** — a senior frontend engineer building the complete user interface for Apex Weather Scheduling.

## PREREQUISITES
- Phase 4 (API): All Convex functions deployed and working
- Phase 3 (AUTH): Clerk auth flow functional

## YOUR MISSION
Build every page and component, consuming real Convex queries/mutations. NO MOCKS. NO PLACEHOLDER DATA. Every component renders real data from the backend.

## GOLDEN RULE
**If a component needs data, it uses `useQuery()` from Convex. If it needs to change data, it uses `useMutation()` or `useAction()`. Never `useState` for server data. Never `fetch()` to Convex.**

## STEPS

### Step 1: Build the console shell
File: `apex-ui/app/(console)/layout.tsx`

- Sidebar navigation: Dashboard, Weather Scheduling, Notifications, Settings
- Top bar: Business name, user avatar (Clerk `<UserButton />`), plan badge
- Responsive: Sidebar collapses on mobile
- Use `useQuery` to fetch business name and plan

### Step 2: Build the Weather Dashboard (main page)
File: `apex-ui/app/(console)/scheduling/weather/page.tsx` + `WeatherSchedulingClient.tsx`

Layout:
```
┌──────────────────────────────────────────────────┐
│ Weather Dashboard          [Check Now] [Settings]│
├──────────────────────────────────────────────────┤
│ WeatherStatsBar                                  │
│ 4 rescheduled · 8 proceeding · $2,400 protected  │
├──────────────────────────────────────────────────┤
│ WeatherStrip (hourly conditions bar)             │
│ ██████████░░░░░░░ Rain 10AM-3PM                  │
├──────────────────────────────────────────────────┤
│ TradeSelector: [All] [Roofing] [Painting] [Lawn] │
├──────────────────────────────────────────────────┤
│ JobCardGrid                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ 🟢 8AM  │ │ 🔴10AM  │ │ 🟡11AM  │             │
│ │ Johnson │ │ Williams│ │ Park    │             │
│ │ HVAC    │ │ Roof→Mon│ │ Paint   │             │
│ └─────────┘ └─────────┘ └─────────┘             │
├──────────────────────────────────────────────────┤
│ BulkActionBar                                    │
│ [Notify All Clients] [Override: Send Crews]      │
└──────────────────────────────────────────────────┘
│ AiChatPanel (collapsible right drawer)           │
└──────────────────────────────────────────────────┘
```

Data sources:
- `useQuery(api.jobs.getJobsByDate, { businessId, date })`
- `useQuery(api.weatherStatus.getStatusByDate, { businessId, date })`
- `useQuery(api.weatherStatus.getDashboardStats, { businessId, date })`

### Step 3: Build individual components

#### WeatherStatsBar
- Shows: jobs green/yellow/red counts, total rescheduled, revenue protected
- Data: `getDashboardStats` query
- Animated counters on load

#### WeatherStrip
- Horizontal hourly weather bar (6AM-8PM)
- Color-coded blocks: clear (blue), cloudy (gray), rain (dark)
- Shows temp, wind, humidity on hover
- Data: Forecast data from weather check results

#### TradeSelector
- Pill/tab selector for filtering by trade
- "All" + each active trade preset
- Filters JobCardGrid without re-querying (client-side filter)

#### JobCard
- Color-coded border: green/yellow/red
- Shows: time, client name, trade, crew assignment
- Red cards show: "→ [new date]" with reschedule date
- Yellow cards show: warning icon + primary concern
- Click to expand: full weather details, triggered rules, override button
- Override button: `useMutation(api.jobs.updateJob)` to force proceed

#### JobCardGrid
- Responsive grid (4 cols desktop, 2 tablet, 1 mobile)
- Sorted by scheduled time
- Empty state: "No jobs scheduled for [date]"

#### BulkActionBar
- "Notify All Clients" — triggers `bulkNotify` action for all red/yellow jobs
- "Override: Send All Crews" — overrides all yellow jobs to green
- Plan-gated: Pro+ only for bulk actions, show upgrade prompt otherwise
- Confirmation dialog before executing

#### AiChatPanel
- Slide-in drawer from right side
- Chat interface with message history (session-only, not persisted)
- Input sends to `useAction(api.aiChat.askWeatherAdvisor)`
- Shows typing indicator while Ollama processes
- Displays markdown responses
- Plan-gated: Starter+ only

### Step 4: Build Weather Settings page
File: `apex-ui/app/(console)/scheduling/weather/settings/page.tsx`

Layout:
```
┌──────────────────────────────────────────────────┐
│ Weather Rules Settings                           │
├──────────────────────────────────────────────────┤
│ Trade: [Roofing ▼]                               │
├──────────────────────────────────────────────────┤
│ Rule 1: Wind Speed ≥ 25 mph → Cancel             │
│ Rule 2: Wind Speed ≥ 20 mph → Warn               │
│ Rule 3: Rain Prob ≥ 70% → Cancel                 │
│ [+ Add Custom Rule]                              │
├──────────────────────────────────────────────────┤
│ Check Times: 5:00 AM, 6:30 AM  [Edit]            │
│ Notification Chain: Crew Lead → Client → Office  │
├──────────────────────────────────────────────────┤
│ [Reset to Defaults] [Save Changes]                │
└──────────────────────────────────────────────────┘
```

- CRUD for weather rules per trade
- Inline editing of thresholds
- Drag-and-drop notification chain reordering
- All changes via `useMutation(api.weatherRules.*)`

### Step 5: Build Notification History page
File: `apex-ui/app/(console)/notifications/page.tsx`

- Table/list of sent notifications
- Filter by: date range, type (SMS/email), job
- Shows: recipient, message, status (sent/delivered/failed), timestamp
- Data: `useQuery(api.notifications.getNotificationHistory)`

### Step 6: Build Dashboard (home) page
File: `apex-ui/app/(console)/dashboard/page.tsx`

- Today's weather summary (quick glance)
- This week's job count + weather risk preview
- Recent weather actions (last 5 auto-reschedules)
- Quick link to Weather Dashboard

### Step 7: Loading & error states
Every page and component must handle:
- Loading: Skeleton loaders that match component shape (not spinners)
- Error: Error boundary with retry button
- Empty: Meaningful empty state with call-to-action
- Auth loading: Clerk-aware loading state

### Step 8: Responsive design
- Desktop: Full sidebar + multi-column layouts
- Tablet: Collapsed sidebar + 2-column grid
- Mobile: Bottom nav + single column + swipeable cards
- Test at: 1440px, 1024px, 768px, 375px

### Step 9: Verify
- `npm run build` — zero errors
- Every page renders with seed data
- Every interactive element triggers a real Convex function
- No `console.error` in browser
- No hydration mismatches

## QUALITY BAR
After this phase, the product looks and feels like a real SaaS application. Every interaction triggers real backend operations. A user could sign up, see their jobs, check weather, and manage rules — all working end-to-end.
