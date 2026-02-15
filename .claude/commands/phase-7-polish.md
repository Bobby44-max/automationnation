# Phase 7: POLISH — SEO, Error Boundaries, Accessibility Agent

You are the **POLISH agent** — a senior frontend engineer refining Apex Weather Scheduling to production quality.

## PREREQUISITES
- Phase 5 (UI): All pages built and functional
- Phase 6 (INTEGRATIONS): All services connected

## YOUR MISSION
Take the working product and make it production-grade: accessible, SEO-optimized, error-resilient, and performant. This is the difference between a prototype and a product people trust.

## STEPS

### Step 1: Error Boundaries
Create `apex-ui/components/error-boundary.tsx`:

- Global error boundary wrapping the console layout
- Per-page error boundaries for each route
- Per-component error boundaries for critical widgets (JobCardGrid, AiChatPanel)
- Each boundary shows:
  - User-friendly error message (not stack traces)
  - "Retry" button that resets the boundary
  - "Report Issue" link
- Log errors to console with context (which component, what data)

### Step 2: Loading States (Skeleton UI)
Replace any remaining spinners with skeleton loaders:

- `JobCardSkeleton` — Matches JobCard dimensions with pulsing gray blocks
- `WeatherStripSkeleton` — Horizontal bar skeleton
- `StatsBarSkeleton` — Number boxes with pulsing text
- `TableSkeleton` — Row placeholders for notification history
- All skeletons use `animate-pulse` from Tailwind
- Skeletons match exact layout dimensions to prevent layout shift

### Step 3: Empty States
Every list/grid must have a meaningful empty state:

- No jobs today: "No jobs scheduled for [date]. Add jobs to start tracking weather."
- No weather rules: "Set up your first trade preset to enable auto-scheduling."
- No notifications: "No notifications sent yet. Weather checks will trigger notifications automatically."
- No weather data: "Run a weather check to see conditions for today's jobs."
- Each empty state has a primary CTA button

### Step 4: SEO & Metadata
For marketing pages (`/(marketing)`):

```typescript
// app/(marketing)/layout.tsx
export const metadata: Metadata = {
  title: "Apex Weather Scheduling — Stop Being Your Own Weather Dispatcher",
  description: "Automated weather-based job scheduling for service businesses. Auto-reschedule, smart notifications, trade-specific thresholds.",
  openGraph: { ... },
  twitter: { ... },
};
```

- Per-page metadata for landing, pricing
- Canonical URLs
- Structured data (JSON-LD) for SaaS product
- Sitemap generation
- robots.txt

### Step 5: Accessibility (WCAG 2.1 AA)
Audit and fix:

**Keyboard navigation:**
- All interactive elements focusable via Tab
- Focus visible styles (not just outline removal)
- Escape closes modals/drawers
- Enter/Space activates buttons
- Arrow keys navigate JobCardGrid

**Screen readers:**
- All images have alt text
- Status colors have text labels (not just color)
- `aria-label` on icon-only buttons
- `aria-live="polite"` on weather status updates
- `role="status"` on stats counters
- Form inputs have associated labels

**Color contrast:**
- All text meets 4.5:1 contrast ratio (AA)
- Status indicators use icons + text, not just color
- GREEN: checkmark icon + "Clear"
- YELLOW: warning icon + "Caution"
- RED: alert icon + "Cancelled/Rescheduled"

**Motion:**
- Respect `prefers-reduced-motion` media query
- No auto-playing animations that can't be paused

### Step 6: Performance Optimization

**Images:**
- Use `next/image` for all images
- WebP format with fallback
- Proper `sizes` attribute for responsive images

**Fonts:**
- Use `next/font` for font loading
- `font-display: swap` to prevent FOIT

**Bundle:**
- Dynamic imports for heavy components (AiChatPanel, recharts)
- `Suspense` boundaries around lazy-loaded components

**Data:**
- Convex queries already handle real-time — no additional caching needed
- Debounce search/filter inputs (300ms)
- Virtualize long lists if > 50 items (notification history)

### Step 7: Toast Notifications (Sonner)
Implement consistent toast pattern:

```typescript
// Success: "Job rescheduled to Monday, March 18"
// Warning: "Weather check found 3 jobs at risk"
// Error: "Failed to send notification. Retrying..."
// Info: "Weather data refreshed"
```

- Auto-dismiss after 5 seconds (errors persist until dismissed)
- Stack max 3 toasts
- Position: bottom-right

### Step 8: Responsive Polish
Final responsive pass at each breakpoint:

- **1440px**: Full desktop layout
- **1024px**: Sidebar collapsed, 3-column grid
- **768px**: No sidebar, 2-column grid, bottom nav
- **375px**: Single column, stacked cards, simplified stats

Fix any:
- Text overflow/truncation issues
- Touch target sizes (minimum 44x44px on mobile)
- Horizontal scroll issues
- Modal/drawer sizing on mobile

### Step 9: Dark Mode (optional but recommended)
If time permits:
- CSS custom properties for all colors
- `prefers-color-scheme` media query
- Manual toggle in settings
- Persist preference in localStorage

### Step 10: Final Visual QA
- Consistent spacing throughout (use Tailwind spacing scale)
- Consistent border radius (use design tokens)
- Consistent shadow depth (card → modal → tooltip)
- No orphaned text (last word alone on a line)
- Icons consistent size and weight (Lucide throughout)
- Status colors used consistently everywhere

## QUALITY BAR
After this phase, the product feels polished and trustworthy. Accessibility audit passes. No unhandled errors crash the app. Loading states prevent jank. The product looks like it's backed by a team, not a prototype.
