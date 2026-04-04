#!/bin/bash
# Pre-Commit Gate — Verify code quality before commit
echo "=== Pre-Commit Gate ==="

ERRORS=0

# TypeScript check
if [ -f tsconfig.json ]; then
  echo "Running typecheck..."
  npx tsc --noEmit 2>&1
  if [ $? -ne 0 ]; then
    echo "FAIL: TypeScript errors found"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: TypeScript"
  fi
fi

# ESLint check
if [ -f .eslintrc* ] || [ -f eslint.config* ]; then
  echo "Running lint..."
  npm run lint 2>&1
  if [ $? -ne 0 ]; then
    echo "FAIL: Lint errors found"
    ERRORS=$((ERRORS + 1))
  else
    echo "PASS: Lint"
  fi
fi

if [ $ERRORS -gt 0 ]; then
  echo "=== BLOCKED: $ERRORS check(s) failed ==="
  exit 1
fi

echo "=== PASS: All checks passed ==="
