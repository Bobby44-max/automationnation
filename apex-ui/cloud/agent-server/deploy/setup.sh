#!/bin/bash
# Agent Server Setup Script for Hostinger VPS
#
# Run as root:
#   chmod +x setup.sh && sudo ./setup.sh

set -e

echo "=== Apex Agent Server Setup ==="

# 1. Create session directory
echo "[1/4] Creating session directory..."
mkdir -p /tmp/agent-sessions
chmod 755 /tmp/agent-sessions

# 2. Install systemd service
echo "[2/4] Installing systemd service..."
cp agent-server.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable agent-server

# 3. Copy Traefik dynamic config
echo "[3/4] Installing Traefik route..."
TRAEFIK_DYNAMIC_DIR="/etc/traefik/dynamic"
if [ -d "$TRAEFIK_DYNAMIC_DIR" ]; then
  cp traefik-agent.yml "$TRAEFIK_DYNAMIC_DIR/agent-webhook.yml"
  echo "  Traefik config copied to $TRAEFIK_DYNAMIC_DIR/agent-webhook.yml"
else
  echo "  WARNING: $TRAEFIK_DYNAMIC_DIR not found."
  echo "  Manually place traefik-agent.yml in your Traefik dynamic config directory."
fi

# 4. Start the service
echo "[4/4] Starting agent-server..."
systemctl start agent-server
systemctl status agent-server --no-pager

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Set AGENT_SHARED_SECRET:"
echo "     sudo systemctl edit agent-server"
echo "     Add: Environment=AGENT_SHARED_SECRET=your-secret-here"
echo ""
echo "  2. Set the same secret in Vercel:"
echo "     vercel env add AGENT_SHARED_SECRET"
echo "     vercel env add AGENT_WEBHOOK_URL https://your-domain.com/agent-webhook"
echo ""
echo "  3. Verify Traefik picked up the route:"
echo "     curl -X POST https://your-domain.com/agent-webhook -d '{\"action\":\"poll\",\"sessionId\":\"test\"}'"
echo ""
echo "  4. Check logs:"
echo "     journalctl -u agent-server -f"
