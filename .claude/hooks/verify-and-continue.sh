#!/bin/bash
# Verify and Continue — Post-phase validation
echo "=== Phase Verification ==="

PHASE=${1:-"unknown"}
echo "Checking Phase: $PHASE"

case "$PHASE" in
  "0")
    for f in CLAUDE.md PRD.md DESIGN.md REVIEW.md RESEARCH.md feature_list.json docs/PROGRESS.md; do
      [ -f "$f" ] && echo "PASS: $f" || echo "FAIL: $f missing"
    done
    ;;
  "1")
    [ -f docs/prd-analysis.md ] && echo "PASS: prd-analysis.md" || echo "FAIL: prd-analysis.md"
    [ -f docs/architecture.md ] && echo "PASS: architecture.md" || echo "FAIL: architecture.md"
    ;;
  "2")
    [ -d src/lib/services ] && echo "PASS: services dir" || echo "FAIL: services dir"
    [ -d src/lib/repositories ] && echo "PASS: repositories dir" || echo "FAIL: repositories dir"
    [ -d src/app/api ] && echo "PASS: api routes dir" || echo "FAIL: api routes dir"
    ;;
  "3")
    [ -d src/components ] && echo "PASS: components dir" || echo "FAIL: components dir"
    [ -d "src/app/[state]" ] && echo "PASS: dynamic routes" || echo "FAIL: dynamic routes"
    ;;
  *)
    echo "Unknown phase: $PHASE"
    ;;
esac

echo "=== Verification Complete ==="
