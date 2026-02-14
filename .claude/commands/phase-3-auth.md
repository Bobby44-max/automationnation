# Phase 3: AUTH — Authentication, Authorization & Multi-Tenancy Agent

You are the **AUTH agent** — a senior security engineer implementing bulletproof auth for Apex Weather Scheduling.

## PREREQUISITES
- Phase 2 (SCHEMA): `businesses`, `users` tables must exist with indexes
- Clerk keys must be in `.env.local`

## YOUR MISSION
Implement complete authentication flow, role-based access control, and multi-tenant isolation so that every subsequent phase inherits security by default.

## STEPS

### Step 1: Configure Clerk + Convex integration
Set up `apex-ui/convex/auth.config.ts`:
```typescript
export default {
  providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN }]
};
```

### Step 2: Create Next.js middleware
Create `apex-ui/middleware.ts`:
- Protect all `/(console)` routes — require authentication
- Allow `/(marketing)` and `/(auth)` routes — public access
- Allow `/api/webhooks/*` — webhook endpoints (no auth, signature verification instead)
- Redirect unauthenticated users from console to sign-in

### Step 3: Implement Clerk webhook handler
Create `apex-ui/app/api/webhooks/clerk/route.ts`:
- Handle `user.created` → Create `businesses` + `users` records in Convex
- Handle `user.updated` → Sync name/email changes
- Handle `user.deleted` → Mark business as inactive
- Verify webhook signature with `svix`

### Step 4: Build auth helper functions
Create `apex-ui/convex/auth.ts`:

```typescript
// getAuthenticatedUser — Extract user from Convex auth context
// Returns: { userId, businessId, role }
// Throws: if not authenticated

// requireRole — Check user has minimum required role
// Role hierarchy: owner > admin > dispatcher > crew_lead

// requireBusinessAccess — Verify user belongs to the requested businessId
// This is THE multi-tenant guard. Every query/mutation must call this.

// requirePlan — Check business has required pricing plan for feature access
// Used for feature gating (e.g., bulk actions require Pro+)
```

### Step 5: Create auth provider wrapper
Create `apex-ui/components/providers/auth-provider.tsx`:
- Wrap `ClerkProvider` with Convex auth integration
- Handle loading states
- Handle auth errors gracefully

### Step 6: Build sign-in / sign-up pages
- `apex-ui/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Clerk SignIn component
- `apex-ui/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Clerk SignUp component
- Style to match product branding
- Include redirect after auth to `/dashboard`

### Step 7: Create onboarding flow
After first sign-up:
1. Clerk webhook creates business + user
2. User lands on `/onboarding` (if no trade presets exist)
3. Onboarding: select primary trade → auto-load trade preset → redirect to dashboard

### Step 8: Implement RBAC guards
Create client-side role guards:
```typescript
// useRequireRole hook — Redirect if insufficient permissions
// RoleGate component — Conditionally render UI based on role
// Example: Only owners/admins see billing settings
```

### Step 9: Secure all existing Convex functions
Audit every function in `apex-ui/convex/weatherScheduling.ts`:
- Add `getAuthenticatedUser()` call at the top of every query/mutation
- Add `requireBusinessAccess(ctx, args.businessId)` where applicable
- Remove any hardcoded businessId values

### Step 10: Test auth flow
Verify end-to-end:
1. Sign up → business created → redirected to onboarding
2. Sign in → redirected to dashboard
3. Access console without auth → redirected to sign-in
4. Access another business's data → rejected
5. Crew lead accessing admin features → rejected

## ROLE HIERARCHY

| Role | Dashboard | Weather Rules | Bulk Actions | Billing | Team Mgmt |
|------|-----------|---------------|-------------|---------|-----------|
| owner | Full | CRUD | Yes | Full | Full |
| admin | Full | CRUD | Yes | View | Add/Remove |
| dispatcher | Full | Read | Yes | No | No |
| crew_lead | Own jobs | Read | No | No | No |

## QUALITY BAR
After this phase, there is zero path to access data without authentication, zero path to access another tenant's data, and role checks gate every sensitive operation.
