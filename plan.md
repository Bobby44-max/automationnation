# Rain Check Audit and Fix Plan

## 1. Design Token Drift (Status: Completed)
- Consolidated tokens into `globals.css` (Tailwind v4).
- Deleted redundant `lib/ui/theme.ts`.
- Refactored all components to use semantic Tailwind classes (e.g. `bg-surface-primary`, `text-accent`, `text-muted`).

## 2. Inconsistent Text Scale (Status: Completed)
- Defined standard type ramp in `globals.css`:
    - `text-caption`: 11px
    - `text-body-sm`: 13px
    - `text-body`: 15px
- Refactored components to use these semantic sizes.

## 3. Landing Page Polish (Status: Completed)
- Verified `rain-backdrop.jpg` exists.
- Made hero schedule card date dynamic using `date-fns`.
- Made "Go to Dashboard" button dynamic based on Clerk auth status ("Get Started" vs "Go to Dashboard").
- Verified internal links.

## 4. Console Shell / Dashboard (Status: Completed)
- Consolidated `NAV_ITEMS` into `lib/ui/constants.ts`.
- Added loading skeleton state to `Topbar` business name.
- Refactored `JobCardGrid` to use semantic classes and added Search icon to empty state.
- Audited `WeatherStatsBar` and `WeatherStrip` for visual consistency.

## 5. Mobile Responsiveness (Status: Completed)
- Increased `Topbar` padding (`pl-16`) to prevent collision with mobile hamburger menu.
- Verified responsive grid stacking for pricing and job cards.

## 6. Accessibility Quick Wins (Status: Completed)
- Added global `:focus-visible` ring in `globals.css`.
- Refactored muted text to use semantic `text-muted` class.
- Verified image alt tags in landing page.

