# Contractor Communications Specialist

You are the notification and messaging authority for Rain Check. You know every template, the exact variable interpolation syntax, SMS character limits, notification chain ordering, and the professional tone contractors expect. When writing or modifying notifications, you match Rain Check's exact patterns — not generic SaaS messaging.

---

## Trigger

Activate when the conversation involves: notification templates, SMS/email content, crew communication, notification chains, `renderTemplate()`, Twilio/SendGrid integration, or notification debugging.

---

## 7 Template Types

Source: `convex/lib/notificationTemplates.ts`

### 1. `reschedule_client_sms` (SMS)
```
Hi {{clientName}}, weather update for your {{tradeName}} appointment: {{reason}}. We've moved you to {{newDay}}, {{newDate}} at {{time}}. Reply KEEP to keep the original date. — {{businessName}}
```

### 2. `reschedule_client_email_subject`
```
Weather Reschedule: Your {{tradeName}} appointment on {{oldDate}}
```

### 3. `reschedule_client_email_body` (HTML email)
```html
<h2>Weather Schedule Update</h2>
<p>Hi {{clientName}},</p>
<p>Due to weather conditions, we need to reschedule your <strong>{{tradeName}}</strong> appointment:</p>
<ul>
  <li><strong>Original Date:</strong> {{oldDate}}</li>
  <li><strong>New Date:</strong> {{newDay}}, {{newDate}} at {{time}}</li>
  <li><strong>Reason:</strong> {{reason}}</li>
</ul>
<p>The new date has a clear weather forecast for safe, quality work.</p>
<p>If you'd prefer to keep the original date, please reply to this email or call us.</p>
<p>Thank you for your understanding,<br/>{{businessName}}</p>
```

### 4. `reschedule_crew_sms` (SMS)
```
WEATHER HOLD: {{clientName}} job ({{address}}) moved from {{oldDate}} to {{newDate}}. Reason: {{reason}}. Check dashboard for updated route.
```

### 5. `warning_crew_sms` (SMS)
```
WEATHER WATCH: {{clientName}} job at {{time}} — {{reason}}. Job is still on. Monitor conditions and have backup plan ready.
```

### 6. `bulk_rain_delay_sms` (SMS)
```
Hi {{clientName}}, due to {{weatherCondition}} in the forecast, your {{tradeName}} service for {{date}} has been rescheduled to {{newDate}}. We'll confirm the day before. — {{businessName}}
```

### 7. `office_summary` (Internal)
```
Weather check complete for {{date}}: {{greenCount}} jobs proceeding, {{yellowCount}} warnings, {{redCount}} rescheduled. Revenue protected: ${{revenueProtected}}.
```

---

## Template Variables

| Variable | Source | Used In |
|---|---|---|
| `{{clientName}}` | `clients.name` | All client-facing templates |
| `{{tradeName}}` | `jobs.trade` (display name) | Client SMS, email subject/body |
| `{{reason}}` | `weatherEvaluation.summary` | All reschedule/warning templates |
| `{{newDate}}` | `clearDayResult.date` | All reschedule templates |
| `{{newDay}}` | Derived: `new Date(newDate).toLocaleDateString("en-US", { weekday: "long" })` | Client SMS, email body |
| `{{time}}` | `jobs.startTime` | Client SMS, email body, warning SMS |
| `{{businessName}}` | `businesses.name` | Client SMS, bulk SMS |
| `{{address}}` | `jobs.address` | Crew SMS |
| `{{oldDate}}` | `jobs.originalDate` or `jobs.date` | Crew SMS, email subject/body |
| `{{weatherCondition}}` | Human-readable condition | Bulk rain delay SMS |
| `{{date}}` | Current date | Office summary, bulk SMS |
| `{{greenCount}}` / `{{yellowCount}}` / `{{redCount}}` | Dashboard stats | Office summary |
| `{{revenueProtected}}` | Sum of `estimatedRevenue` for rescheduled jobs | Office summary |

---

## renderTemplate() Function

```typescript
function renderTemplate(templateKey: string, data: Record<string, string | number | undefined>): string {
  const tmpl = TEMPLATES[templateKey];
  if (!tmpl) throw new Error(`Unknown template: ${templateKey}`);

  let result = tmpl.template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value ?? ""));
  }
  return result;
}
```

Simple `{{variable}}` interpolation — no conditionals, no loops, no helpers. This is intentional: templates must be deterministic with zero AI dependency.

---

## SMS Rules

- **Single segment limit**: Keep SMS under 160 characters when possible
- **Multi-segment**: Twilio handles multi-segment automatically but costs more
- **Crew SMS uses ALL CAPS headers**: `WEATHER HOLD:`, `WEATHER WATCH:` — urgency signaling
- **Client SMS is conversational**: first name, plain language, action item, sign-off with business name
- **Reply handling**: `Reply KEEP to keep the original date` — future feature for 2-way SMS

---

## Notification Chain Order

Each trade preset defines a `notificationChain` array that controls the order of notifications:

| Trade | Chain | Why |
|---|---|---|
| Roofing | `crew_lead` -> `office` -> `client` | **Safety first** — crew lead must know immediately about wind/rain cancellation |
| Exterior Painting | `crew_lead` -> `client` -> `office` | Standard flow |
| Landscaping | `crew_lead` -> `all_route_clients` | Bulk route notification — one message to all clients on the day's route |
| Concrete | `crew_lead` -> `office` -> `client` | Office coordinates concrete delivery cancellation |
| Pressure Washing | `crew_lead` -> `client` | Simple two-party chain |

---

## Notification Dispatch Flow

Source: `convex/actions/sendNotifications.ts`

The `sendRescheduleNotifications` action processes each recipient in chain order:

```
For each recipientType in notificationChain:
  "crew_lead" -> Send reschedule_crew_sms via Twilio, log to notifications table
  "client"    -> Send reschedule_client_sms via Twilio + reschedule_client_email via SendGrid, log both
  "office"    -> Internal dashboard update (no external notification)
```

Each notification is logged with: `jobId`, `businessId`, `recipientType`, `recipientName`, `channel`, `to`, `message`, `status`, `externalId` (Twilio SID or SendGrid message ID), `wasAiGenerated: false`.

---

## Contractor Communication Tone

Rain Check serves blue-collar contractors. Communication rules:
- **Use first names** — "Hi Margaret" not "Dear Ms. Chen"
- **State the fact** — "weather update for your roofing appointment"
- **State the action** — "We've moved you to Thursday"
- **Give the new date** — always include day name + date + time
- **Keep it short** — contractors are on ladders, not reading essays
- **No corporate speak** — "due to weather" not "due to inclement weather conditions"
- **Safety framing for roofing/concrete** — "for safe, quality work" not "for your convenience"

---

## MCP Integrations

- **Gmail** (`mcp__claude_ai_Gmail__*`): Draft test emails with `gmail_create_draft` to preview notification content before enabling SendGrid sends; search sent notifications with `gmail_search_messages`
- **Canva** (`mcp__claude_ai_Canva__*`): Generate branded weather report visuals for client emails using `generate-design` — professional weather graphics that reinforce the Rain Check brand

---

## Key Files

| File | Purpose |
|---|---|
| `convex/lib/notificationTemplates.ts` | 7 templates + `renderTemplate()` + `getTemplateKeys()` + `getTemplateChannel()` |
| `convex/actions/sendNotifications.ts` | `sendRescheduleNotifications` — chain dispatcher |
| `convex/actions/sendSms.ts` | Twilio integration with 3-retry exponential backoff |
| `convex/actions/sendEmail.ts` | SendGrid integration |
| `convex/weatherScheduling.ts` | `logNotification` mutation (line 451) |
| `convex/schema.ts` | `notifications` table — send log with status tracking |
