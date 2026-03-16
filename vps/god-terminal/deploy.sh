#!/bin/bash
# Rain Check God Terminal — One-command deploy
# Usage: bash vps/god-terminal/deploy.sh
set -e

echo "=== Rain Check God Terminal Deploy ==="

# Stop existing processes
pm2 delete rain-check-god 2>/dev/null || true
pm2 delete rain-check-agent 2>/dev/null || true

# Install dependencies
cd /opt/rc/vps/god-terminal
npm install --production

# Create .env if it doesn't exist
if [ ! -f .env ]; then
cp .env.example .env
echo "Created .env from template — fill in API keys manually on the VPS"
echo "NEVER commit real keys to the repo"
else
echo ".env already exists, skipping"
fi

# Create .claude config for Claude CLI
mkdir -p /opt/rc/vps/god-terminal/.claude/rules
if [ ! -f /opt/rc/vps/god-terminal/.claude/settings.local.json ]; then
cat > /opt/rc/vps/god-terminal/.claude/settings.local.json << 'SETTINGS'
{
  "permissions": {
    "allow": [
      "Bash(curl:*)",
      "Bash(date:*)",
      "Bash(echo:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(jq:*)"
    ],
    "deny": [
      "Bash(rm:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      "Bash(chmod:*)",
      "Bash(chown:*)",
      "Bash(apt:*)",
      "Bash(pip:*)",
      "Bash(npm:*)",
      "Bash(sudo:*)",
      "Bash(kill:*)",
      "Bash(systemctl:*)",
      "Bash(iptables:*)",
      "Bash(pm2:*)"
    ]
  }
}
SETTINGS
echo "Created .claude/settings.local.json"
fi

if [ ! -f /opt/rc/vps/god-terminal/.claude/rules/notion-publish.md ]; then
cat > /opt/rc/vps/god-terminal/.claude/rules/notion-publish.md << 'RULES'
# Rain Check Weather Operations AI — Rules

## Identity
You are the Rain Check Weather Operations AI. You help contractors manage weather-impacted schedules.

## Allowed Actions
- Use curl to call weather APIs (Tomorrow.io), email (SendGrid), SMS (Twilio), and database (Convex)
- Read environment variables for API keys — never display them
- Parse JSON responses with jq or inline

## Forbidden Actions
- Do NOT modify any files on disk
- Do NOT install packages or modify system config
- Do NOT run destructive commands (rm, mv, kill, etc.)
- Do NOT expose API keys, tokens, or credentials in output
- Do NOT execute commands outside of curl, date, echo, cat, head, jq

## Style
- Be concise — contractors are on job sites
- Use professional tone
- When sending emails, use clean HTML with Rain Check branding
- Always confirm before rescheduling jobs
RULES
echo "Created .claude/rules/notion-publish.md"
fi

# Start with PM2
pm2 start server.js --name rain-check-god
pm2 save
pm2 startup 2>/dev/null || true

# Firewall
iptables -C INPUT -p tcp --dport 3848 -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport 3848 -j ACCEPT

echo ""
echo "=== DONE ==="
echo "God Terminal running on port 3848"
echo "Health check: curl http://localhost:3848/health"
echo ""
echo "IMPORTANT: Ensure 'claude' CLI is installed and authed on this VPS:"
echo "  claude auth login"
echo ""
