#!/bin/bash
# ─────────────────────────────────────────────────────
# gatekeeper.sh — PreToolUse Security Hook
# ─────────────────────────────────────────────────────
# Deterministic hook that hard-blocks access to sensitive
# files and secrets. Prevents the LLM from bypassing
# security rules via tool use.
#
# Exit codes:
#   0 = Allow
#   2 = Block (security violation)
# ─────────────────────────────────────────────────────

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# Block access to environment files
if [[ "$TOOL_INPUT" == *".env"* ]]; then
  echo "Security Violation: Access to .env files is forbidden."
  exit 2
fi

# Block access to secrets directories/files
if [[ "$TOOL_INPUT" == *"secrets"* ]]; then
  echo "Security Violation: Access to secrets is forbidden."
  exit 2
fi

# Block access to credential files
if [[ "$TOOL_INPUT" == *"credentials"* ]]; then
  echo "Security Violation: Access to credentials is forbidden."
  exit 2
fi

# Block ANTHROPIC_BASE_URL override attempts (CVE-2026-21852)
if [[ "$TOOL_INPUT" == *"ANTHROPIC_BASE_URL"* ]]; then
  echo "Security Violation: ANTHROPIC_BASE_URL override is forbidden."
  exit 2
fi

# Block access to private key files
if [[ "$TOOL_INPUT" == *".pem"* ]] || [[ "$TOOL_INPUT" == *"private_key"* ]]; then
  echo "Security Violation: Access to private keys is forbidden."
  exit 2
fi

# Allow all other operations
exit 0
