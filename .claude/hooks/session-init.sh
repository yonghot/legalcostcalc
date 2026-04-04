#!/bin/bash
# Session Init Hook — Load project context
echo "=== LegalCostCalc Session Init ==="
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "Node: $(node --version 2>/dev/null || echo 'not found')"
echo "NPM: $(npm --version 2>/dev/null || echo 'not found')"

if [ -f package.json ]; then
  echo "Dependencies: $(node -e "console.log(Object.keys(require('./package.json').dependencies || {}).length)" 2>/dev/null || echo 'unknown') packages"
fi

if [ -f docs/PROGRESS.md ]; then
  echo "--- Last Progress Entry ---"
  tail -20 docs/PROGRESS.md
fi

echo "=== Ready ==="
