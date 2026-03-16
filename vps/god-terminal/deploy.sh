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
