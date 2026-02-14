# n8n Weather Scheduling Workflows

These workflow definitions are designed for import into your n8n instance.
They orchestrate the entire weather scheduling engine.

## Setup

1. Open your n8n instance (usually `http://localhost:5678`)
2. Import each `.json` workflow via Settings > Import
3. Configure credentials:
   - Convex: HTTP Request nodes pointing to your Convex deployment
   - Tomorrow.io: API key in HTTP Request headers
   - Twilio: Account SID + Auth Token
   - SendGrid: API key
   - Ollama: Points to `http://localhost:11434`

## Workflows

### weather-check-daily.json (Core - Phase 1)
- **Trigger:** Cron at 5:00 AM daily
- **Purpose:** Check weather for all scheduled jobs, evaluate rules, reschedule red jobs
- **Flow:** Fetch jobs → Fetch weather → Rule engine → Route → Reschedule/Notify

### find-next-clear-day.json (Sub-workflow - Phase 1)
- **Trigger:** Called by daily check when a job is flagged red
- **Purpose:** Scan 7-day forecast to find the next suitable work day

### manual-weather-check.json (Phase 1)
- **Trigger:** Webhook POST /webhook/weather-check-now
- **Purpose:** Same as daily check but triggered by dashboard button

### bulk-rain-delay.json (Phase 1)
- **Trigger:** Webhook POST /webhook/bulk-rain-delay
- **Purpose:** Reschedule entire day's route and notify all clients

### weekly-weather-summary.json (Phase 3 - Ollama)
- **Trigger:** Cron Sunday at 8:00 PM
- **Purpose:** AI-generated weekly weather outlook email to business owner

### weather-ai-chat.json (Phase 3 - Ollama)
- **Trigger:** Webhook POST /webhook/weather-chat
- **Purpose:** Power the dashboard AI chat with Ollama

## Webhook URLs

Once imported, your n8n webhooks will be available at:
```
POST {N8N_URL}/webhook/weather-check-now
POST {N8N_URL}/webhook/bulk-rain-delay
POST {N8N_URL}/webhook/weather-chat
```

Set `N8N_WEBHOOK_BASE_URL` in your `.env.local` to match.

## Architecture Note

The n8n workflows call into the AIF executor's weather step handlers
for the actual logic. n8n handles orchestration (cron, routing, HTTP calls),
while the JavaScript rule engine handles evaluation.

For self-contained deployments, you can also run the entire flow
via the AIF executor directly (without n8n) using the
`weatherScheduler.aif.ts` workflow definition.
