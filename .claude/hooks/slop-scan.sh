#!/usr/bin/env bash
# Stop hook — snapshot impeccable design-quality findings for the session.
# Non-blocking: writes .slop.json (gitignored) for review; never fails the turn.
npx --yes impeccable@latest detect --json src/ > .slop.json 2>/dev/null || true
exit 0
