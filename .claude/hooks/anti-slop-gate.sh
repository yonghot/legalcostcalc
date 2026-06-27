#!/usr/bin/env bash
# PostToolUse(Edit|Write) gate — block obvious AI-slop visual patterns in src/.
# Source of truth: design/forbidden.md (hard-blocked subset).
# NOTE: `Inter` is intentionally NOT in the pattern — it is the project's chosen
#       font (DESIGN.md §3). impeccable's overused-font check handles it via
#       DESIGN.md context. (Deviation logged in docs/PROGRESS.md.)
PATTERN='from-purple-|to-blue-|hover:scale-105|#000000'
matches="$(grep -rnE "$PATTERN" src/ 2>/dev/null || true)"
if [ -n "$matches" ]; then
  echo "Anti-slop gate: forbidden visual pattern in src/ (see design/forbidden.md):" >&2
  echo "$matches" >&2
  exit 2
fi
exit 0
