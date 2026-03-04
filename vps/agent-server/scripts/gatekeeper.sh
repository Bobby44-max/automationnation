#!/usr/bin/env bash
#
# Rain Check Agent Gatekeeper — PreToolUse hook
#
# Blocks Claude CLI from accessing sensitive files and directories.
# Reads the tool input from stdin (JSON) and checks for dangerous patterns.

set -euo pipefail

INPUT=$(cat)

# Extract the tool name and content from the JSON input
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null || true)

# Blocked file patterns
BLOCKED_PATTERNS=(
  ".env"
  "credentials"
  "secret"
  "private.key"
  "id_rsa"
  "id_ed25519"
  "/etc/shadow"
  "/etc/passwd"
  "ANTHROPIC_API_KEY"
  "AGENT_SERVER_SECRET"
  "STRIPE_SECRET"
  "CLERK_SECRET"
  "TWILIO_AUTH"
  "SENDGRID_API"
)

# Check if any blocked pattern appears in the tool input
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$TOOL_INPUT" | grep -qi "$pattern" 2>/dev/null; then
    echo '{"decision": "block", "reason": "Access to sensitive files/keys is not allowed."}'
    exit 0
  fi
done

# Allow the tool use
echo '{"decision": "allow"}'
exit 0
