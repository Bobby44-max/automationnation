# Rain Check — Environment Setup Guide

## 🎯 Quick Setup Checklist

Your Rain Check app is deployed to **small-pigeon-28.convex.cloud**. Follow these steps to connect everything:

### 1. Copy the Template
```bash
cd /mnt/Documents/GitHub/automationnation
cp .env.local .env.local.backup  # backup if exists
# Then edit .env.local with values below
```

### 2. Set Convex Values (CRITICAL — App Won't Work Without These)
```bash
CONVEX_DEPLOYMENT=small-pigeon-28
NEXT_PUBLIC_CONVEX_URL=https://small-pigeon-28.convex.cloud
```

### 3. Set Clerk Auth Keys
Get these from: https://dashboard.clerk.com
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 4. Set Weather API Keys (REQUIRED for Job Monitoring)
```bash
# Primary provider (recommended)
TOMORROW_IO_API_KEY=xxxxx  # Get from: https://www.tomorrow.io/weather-api/

# Fallback provider
OPENWEATHERMAP_API_KEY=xxxxx  # Get from: https://openweathermap.org/api
```

### 5. Set Notification Keys (Optional for Demo, Required for Production)
```bash
# Twilio for SMS
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# SendGrid for Email
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=weather@yourdomain.com
```

### 6. Set Stripe Keys (Optional for Demo, Required for Billing)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 7. Set App URL
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Minimum Viable Demo Setup

To demo Rain Check to Alu Rex **TODAY**, you only need:

### CRITICAL (App Won't Load Without These):
- ✅ `CONVEX_DEPLOYMENT=small-pigeon-28`
- ✅ `NEXT_PUBLIC_CONVEX_URL=https://small-pigeon-28.convex.cloud`
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`

### RECOMMENDED (For Full Demo):
- ⚠️ `TOMORROW_IO_API_KEY` — Without this, weather checks will fail
- ⚠️ `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` — For SMS demo

### OPTIONAL (Can Skip for Demo):
- `OPENWEATHERMAP_API_KEY` (only needed if Tomorrow.io fails)
- `SENDGRID_API_KEY` (email notifications)
- `STRIPE_SECRET_KEY` (billing)

---

## 📋 Complete .env.local Template

```bash
# ============================================================
# APEX WEATHER SCHEDULING — ENVIRONMENT VARIABLES
# ============================================================

# --- Convex Backend (REQUIRED) ---
CONVEX_DEPLOYMENT=small-pigeon-28
NEXT_PUBLIC_CONVEX_URL=https://small-pigeon-28.convex.cloud

# --- Clerk Auth (REQUIRED) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# --- Weather Data Providers (REQUIRED for weather checks) ---
TOMORROW_IO_API_KEY=xxxxx
OPENWEATHERMAP_API_KEY=xxxxx

# --- SMS Notifications (Twilio) ---
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# --- Email Notifications (SendGrid) ---
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=weather@yourdomain.com

# --- Stripe Billing ---
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Testing the Setup

After setting env vars:

```bash
# 1. Verify Convex connection
cd /mnt/Documents/GitHub/automationnation
npm run dev

# 2. Open browser to http://localhost:3000
# 3. You should see the new landing page!
# 4. Sign up/in to test the console

# 5. Create a test job:
#    - Client: "Test Client"
#    - Trade: "roofing"
#    - Date: Tomorrow
#    - Zip: 85001 (Phoenix)

# 6. Weather check should trigger automatically
```

---

## 🎯 Alu Rex Demo Script

1. **Show Landing Page** — "This is what contractors see first"
2. **Sign In** — "Multi-tenant, each contractor gets their own org"
3. **Create Job** — "Add a roofing job for tomorrow in Phoenix"
4. **Show Weather Status** — "Real-time monitoring, auto-reschedule if red"
5. **Show Revenue Tracking** — "See exactly how much we saved"
6. **Show Notifications** — "SMS + Email to clients & crew automatically"

---

## 💰 The $100K Deal

- **Alu Rex pays:** $100K upfront
- **Revenue split:** 50/50 on all licensing to 5-10K contractors
- **Pricing tier for contractors:** $50/mo avg (Starter/Pro mix)
- **If 1,000 contractors sign up:** $25K/mo to Bobby = $300K/year
- **Year 1 total:** $100K upfront + $300K licensing = $400K minimum

---

## 🆘 Troubleshooting

### "Cannot connect to Convex"
- Check `NEXT_PUBLIC_CONVEX_URL` is exactly: `https://small-pigeon-28.convex.cloud`
- Check `CONVEX_DEPLOYMENT` is exactly: `small-pigeon-28`
- Run `npx convex dev` to verify deployment

### "Clerk authentication failed"
- Get fresh keys from https://dashboard.clerk.com → API Keys
- Make sure you're using the **TEST** keys (pk_test_, sk_test_)
- Check sign-in URL is `/sign-in` (not `/signin`)

### "Weather checks failing"
- Get Tomorrow.io API key: https://www.tomorrow.io/weather-api/
- Free tier gives 500 calls/day (enough for demo)
- Make sure key has no spaces/quotes in .env.local

### "SMS not sending"
- Get Twilio trial account: https://console.twilio.com
- Verify phone number in Twilio console
- Trial accounts can only send to verified numbers

---

**Created:** 2026-02-17
**For:** Alu Rex Demo & $100K Deal
**Status:** Ready to Rock! 🚀
