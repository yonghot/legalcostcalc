#!/bin/bash
# Post-Write Format — Auto-format written files
if command -v npx &>/dev/null && [ -f node_modules/.bin/prettier ]; then
  for f in "$@"; do
    if [[ "$f" == *.ts ]] || [[ "$f" == *.tsx ]] || [[ "$f" == *.js ]] || [[ "$f" == *.json ]] || [[ "$f" == *.css ]]; then
      npx prettier --write "$f" 2>/dev/null
    fi
  done
fi
