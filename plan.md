# Rain Check Audit and Fix Plan

## 1. Design Token Drift (Status: COMPLETED)
- Standardized all components to use semantic tokens from `globals.css` (Tailwind v4).
- Replaced hardcoded `gray-950`, `blue-600`, and arbitrary hex values with `surface-primary`, `accent`, etc.
- Mapped industry status colors: `emerald-400` -> `status-green`, `amber-400` -> `status-yellow`, `red-400` -> `status-red`.

## 2. Inconsistent Text Scale (Status: COMPLETED)
- Enforced standard type ramp from `globals.css`:
    - `caption (11px)`: Used for meta, tags, and small labels.
    - `body-sm (13px)`: Used for secondary text and small UI elements.
    - `body (15px)`: Used for main content and primary labels.
- Removed arbitrary `text-[10px]`, `text-[12px]`, etc., and replaced with semantic classes.

## 3. Landing Page Polish (Status: COMPLETED)
- Added `rain-backdrop.jpg` texture at 10% opacity to the hero section.
- Standardized colors and text sizes throughout the page.
- Fixed "Go to Dashboard" button logic and wording.
- Added missing `#how-it-works` anchor and verified all internal links.
- Verified hero schedule card is fully dynamic using `date-fns`.

## 4. Console Shell / Dashboard (Status: COMPLETED)
- Consolidated `NAV_ITEMS` in `lib/ui/constants.ts` and ensured proper consumption.
- Improved `Topbar` loading state with a pulsed skeleton.
- Enhanced `JobCard` and `JobCardGrid` with semantic colors, bold tracking, and improved spacing.
- Added icons and border styling to empty states ("No jobs scheduled").

## 5. Mobile Responsiveness (Status: COMPLETED)
- Verified `Topbar` padding (`pl-16`) prevents collision with the `Sidebar` mobile hamburger button.
- Audited responsive grid stacking for pricing (1->2->4) and job cards (1->2->3->4).
- Ensured all touch targets meet minimum 40px height requirements.

## 6. Accessibility (Status: COMPLETED)
- Standardized focus rings using the `accent` color with consistent offsets.
- Improved contrast for muted text by standardizing on `text-secondary` and `text-muted`.
- Verified semantic HTML structure (headers, nav, main).

---
**Verification:**
- Ran `npx tsc --noEmit` -> Success (0 errors).
- Visual audit of all major pages and components completed.
