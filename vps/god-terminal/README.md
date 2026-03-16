# Rain Check God Terminal

Express server using Anthropic SDK directly for an agentic weather operations AI.
Replaces the old agent-server approach (which spawned Claude CLI processes).

## Quick Start

```bash
cd vps/god-terminal
npm install
cp .env.example .env   # Fill in API keys
node server.js
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/run` | Bearer token | Start session — returns `{ sessionId }` |
| GET | `/api/stream?sessionId=X` | Bearer token | SSE event stream (replay + live) |
| POST | `/api/approve` | Bearer token | Approve/deny pending tool execution |
| GET | `/health` | Public | Server health + active sessions |

## Auth

All `/api/*` routes require `Authorization: Bearer {AGENT_SERVER_SECRET}` header.

## SSE Events

| Event | Data | Description |
|-------|------|-------------|
| `text` | `{ text }` | Streamed text chunk from Claude |
| `tool_use` | `{ toolUseId, toolName, input, requiresApproval }` | Tool invocation started |
| `tool_result` | `{ toolUseId, toolName, result }` | Tool execution result |
| `approval_required` | `{ toolUseId, toolName, input, message }` | Waiting for user approval |
| `approval_resolved` | `{ approved, message }` | Approval decision made |
| `error` | `{ message }` | Error occurred |
| `done` | `{ state }` | Session complete |

## Tools

1. **weather_check** — Tomorrow.io forecast for any zip code
2. **send_email** — SendGrid HTML email dispatch
3. **send_sms** — Twilio SMS notifications
4. **check_jobs** — Query Convex for today's jobs
5. **reschedule_job** — Reschedule a job (requires user approval)

## Deploy to VPS

```bash
# On VPS (72.60.170.65)
mkdir -p /opt/rain-check-god-terminal
# Copy files (scp or git pull)
cd /opt/rain-check-god-terminal
npm install --production
cp .env.example .env && nano .env  # Fill in keys

# Run with systemd or pm2
node server.js
```

## Architecture

```
Client → POST /api/run { message }
         ← { sessionId }

Client → GET /api/stream?sessionId=X
         ← SSE: text chunks, tool invocations, results

         [If tool requires approval]
         ← SSE: approval_required
Client → POST /api/approve { sessionId, approved: true }
         ← SSE: approval_resolved, tool continues

         [Loop continues until end_turn or max 25 rounds]
         ← SSE: done
```
