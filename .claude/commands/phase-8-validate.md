# Phase 8: VALIDATE — Security Audit & Build Checks Agent

You are the **VALIDATE agent** — a senior security engineer and QA lead auditing Apex Weather Scheduling before deployment.

## PREREQUISITES
- All phases 0-7 complete
- Product is functional end-to-end

## YOUR MISSION
Find and fix every security vulnerability, type error, build failure, and logic bug before the product touches production. This is the last gate before real users.

## STEPS

### Step 1: TypeScript Strict Check
```bash
npx tsc --noEmit --strict
```
Fix ALL errors. No `any` types. No `@ts-ignore`. No `@ts-expect-error` unless with documented reason.

### Step 2: Lint & Format
```bash
npm run lint
npx prettier --check "**/*.{ts,tsx,js,json,css}"
```
Fix all lint errors. Fix all format issues.

### Step 3: Build Verification
```bash
npm run build
```
Must complete with zero errors and zero warnings. If there are warnings, evaluate and fix or suppress with documented reason.

### Step 4: Security Audit — Authentication
Verify these for every Convex function:

- [ ] Every `query` calls `getAuthenticatedUser()`
- [ ] Every `mutation` calls `getAuthenticatedUser()`
- [ ] Every `action` calls `getAuthenticatedUser()`
- [ ] No function returns data without `businessId` filter
- [ ] No function accepts `businessId` from client without verifying ownership
- [ ] Webhook handlers verify signatures (Clerk: svix, Stripe: stripe signature)
- [ ] No auth tokens logged or exposed in error messages

### Step 5: Security Audit — Input Validation
For every function that accepts user input:

- [ ] String inputs are length-limited
- [ ] Numeric inputs have min/max bounds
- [ ] Enum inputs are validated against allowed values
- [ ] No raw SQL/NoSQL injection vectors (Convex handles this, but verify)
- [ ] No XSS vectors in rendered content
- [ ] File/path inputs are sanitized

### Step 6: Security Audit — Data Exposure
Verify no sensitive data leaks:

- [ ] API keys not in client-side code (`NEXT_PUBLIC_` only for public keys)
- [ ] No secrets in git history (`git log --all -p | grep -i "secret\|password\|api_key"`)
- [ ] `.env.local` in `.gitignore`
- [ ] Stripe webhook secret not exposed
- [ ] Clerk secret key not exposed
- [ ] Twilio auth token not exposed
- [ ] No sensitive data in error messages shown to users
- [ ] No PII in console.log statements

### Step 7: Security Audit — OWASP Top 10 Check
| Vulnerability | Check | Status |
|---|---|---|
| Injection | Convex uses parameterized queries — verify no raw string building | |
| Broken Auth | Verify Clerk + Convex auth on every endpoint | |
| Sensitive Data Exposure | Verify env vars, no secrets in client bundle | |
| XXE | N/A (no XML processing) | |
| Broken Access Control | Verify RBAC on admin functions, businessId isolation | |
| Security Misconfiguration | Verify headers, CORS, CSP | |
| XSS | Verify no dangerouslySetInnerHTML, sanitize Ollama output | |
| Insecure Deserialization | Verify webhook payload validation | |
| Known Vulnerabilities | `npm audit` — fix critical/high | |
| Insufficient Logging | Verify weatherActions table logs all automated decisions | |

### Step 8: Multi-Tenancy Isolation Audit
For every query and mutation, verify:

```
Scenario: Business A's owner tries to access Business B's data
Expected: 403 or empty result
Test: Call function with Business B's ID using Business A's auth token
```

Check specifically:
- [ ] `getJobsByDate` only returns jobs for the authenticated business
- [ ] `getTradePresets` only returns presets for the authenticated business
- [ ] `rescheduleJob` only works on jobs owned by the authenticated business
- [ ] `bulkNotify` only notifies clients of the authenticated business
- [ ] `getActionHistory` only shows actions for the authenticated business

### Step 9: Feature Gating Audit
Verify plan-based restrictions:

| Feature | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Custom rules | Block | Block | Allow | Allow |
| Bulk actions | Block | Block | Allow | Allow |
| AI Chat | Block | Allow | Allow | Allow |
| Weather windows | Block | Block | Block | Allow |
| SMS notifications | Block | Allow | Allow | Allow |
| API access | Block | Block | Block | Allow |

### Step 10: Dependency Audit
```bash
npm audit
```
- Fix all critical and high severity vulnerabilities
- Document any medium/low that can't be fixed (upstream dependency issues)
- Verify no deprecated packages in use

### Step 11: Performance Check
- [ ] No N+1 query patterns in Convex functions
- [ ] Weather API calls batched by zip code
- [ ] Large lists use pagination (notification history, action history)
- [ ] Images optimized (next/image)
- [ ] Bundle size reasonable (< 200KB first load JS)
- [ ] No memory leaks in useEffect hooks (cleanup functions present)

### Step 12: Generate Security Report
Create `docs/SECURITY_AUDIT.md`:
- Date of audit
- Findings by severity (Critical/High/Medium/Low/Info)
- Status of each finding (Fixed/Accepted/Mitigated)
- Recommendations for future hardening

## QUALITY BAR
After this phase, the product has been through a rigorous security audit. Every vulnerability is fixed or documented. The build is clean. Types are strict. The product is ready for real users and real money.
