#!/bin/bash
# Sync Claude auth from read-only host mount.
# -u (update) = only copy when source is newer, preserving sessions/memories in the persistent volume.
# Auth file (.claude.json) is always refreshed since it contains the latest token.
cp -a -u /home/devuser/.claude-host/. /home/devuser/.claude/ 2>/dev/null
cp /home/devuser/.claude-host.json /home/devuser/.claude.json 2>/dev/null

# Fix macOS → Docker paths in Claude plugin configs
sed -i 's|/Users/wencheng/.claude|/home/devuser/.claude|g' \
  /home/devuser/.claude/plugins/known_marketplaces.json \
  /home/devuser/.claude/plugins/installed_plugins.json 2>/dev/null
sed -i 's|/Users/wencheng/Projects/AISoccerBetting/AI|/app|g' \
  /home/devuser/.claude/plugins/installed_plugins.json 2>/dev/null

# Set up ntfy.sh notification hooks (merged into settings.json)
HOOKS_DIR="/home/devuser/.claude/hooks"
SETTINGS="/home/devuser/.claude/settings.json"
NOTIFY_SCRIPT="$HOOKS_DIR/notify.sh"

mkdir -p "$HOOKS_DIR"

# Create the notify script
cat > "$NOTIFY_SCRIPT" << 'SCRIPT'
#!/bin/bash
# Topic from: env var > ~/.ntfy-topic file > fallback
NTFY_TOPIC="${CLAUDE_NTFY_TOPIC:-}"
[ -z "$NTFY_TOPIC" ] && [ -f "$HOME/.ntfy-topic" ] && NTFY_TOPIC=$(cat "$HOME/.ntfy-topic" 2>/dev/null)
[ -z "$NTFY_TOPIC" ] && exit 0
INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"' 2>/dev/null)

case "$EVENT" in
  Notification)
    TITLE="Claude Code - Input Needed"
    MSG=$(echo "$INPUT" | jq -r '.message // "Waiting for your input"' 2>/dev/null)
    TAGS="warning"
    PRIORITY="high"
    ;;
  Stop)
    TITLE="Claude Code - Done"
    MSG="Finished execution and ready for next prompt"
    TAGS="white_check_mark"
    PRIORITY="default"
    ;;
  *)
    TITLE="Claude Code"
    MSG="Event: $EVENT"
    TAGS="robot"
    PRIORITY="default"
    ;;
esac

curl -s \
  -H "Title: $TITLE" \
  -H "Tags: $TAGS" \
  -H "Priority: $PRIORITY" \
  -d "$MSG" \
  "ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 &

exit 0
SCRIPT
chmod +x "$NOTIFY_SCRIPT"

# Merge hooks into settings.json (add if not present, preserve existing keys)
if [ -f "$SETTINGS" ]; then
  # Check if hooks already configured
  if ! jq -e '.hooks' "$SETTINGS" > /dev/null 2>&1; then
    jq --arg script "$NOTIFY_SCRIPT" '. + {
      "hooks": {
        "Notification": [{"matcher": "", "hooks": [{"type": "command", "command": $script}]}],
        "Stop": [{"matcher": "", "hooks": [{"type": "command", "command": $script}]}]
      }
    }' "$SETTINGS" > "${SETTINGS}.tmp" && mv "${SETTINGS}.tmp" "$SETTINGS"
  fi
else
  cat > "$SETTINGS" << EOF
{
  "hooks": {
    "Notification": [{"matcher": "", "hooks": [{"type": "command", "command": "$NOTIFY_SCRIPT"}]}],
    "Stop": [{"matcher": "", "hooks": [{"type": "command", "command": "$NOTIFY_SCRIPT"}]}]
  }
}
EOF
fi

# Patch Playwright MCP plugin to use chromium (chrome not available on ARM64 Linux)
find /home/devuser/.claude/plugins/cache -path '*/playwright/*/.mcp.json' -exec \
  sed -i 's|\["@playwright/mcp@latest"\]|["@playwright/mcp@latest", "--browser", "chromium"]|g' {} \; 2>/dev/null

# Install node deps if needed
[ -f node_modules/.package-lock.json ] || npm install

# Default: launch Claude; pass args to override (e.g. `docker compose run --rm dev bash`)
if [ $# -gt 0 ]; then
  exec "$@"
else
  exec claude --dangerously-skip-permissions --model "claude-opus-4-6[1m]" --effort max
fi
