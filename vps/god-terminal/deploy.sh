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
cat > .env << 'ENVFILE'
ANTHROPIC_API_KEY=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
AGENT_SERVER_SECRET=rc2026demo
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=bobby@apexai.technology
TWILIO_ACCOUNT_SID=AC9c75a89d5628b0ed1c1d6ee336e1ad8b
TWILIO_AUTH_TOKEN=f2132e6f563365d6315c3f2fc5cd7931
TWILIO_PHONE_NUMBER=+17813748995
TOMORROW_IO_API_KEY=enhsRq7TiV2UttBBAcuJQ7HrHvVXVcBY
CONVEX_URL=https://charming-marten-399.convex.cloud
PORT=3848
ENVFILE
echo "Created .env with all keys"
else
echo ".env already exists, skipping"
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
echo "Test: curl http://localhost:3848/health"
