#!/bin/bash
# Evaluator Script — Independent verification of all deliverables
echo "=== LegalCostCalc Evaluator ==="
echo ""

PASS=0
FAIL=0

check() {
  if [ "$1" = "true" ]; then
    echo "  PASS: $2"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $2"
    FAIL=$((FAIL + 1))
  fi
}

# 1. Build check
echo "■ Build"
npm run build > /dev/null 2>&1
check "$( [ $? -eq 0 ] && echo true || echo false )" "npm run build succeeds"

# 2. TypeScript
echo "■ TypeScript"
npx tsc --noEmit > /dev/null 2>&1
check "$( [ $? -eq 0 ] && echo true || echo false )" "Zero type errors"

# 3. Core files exist
echo "■ Core Files"
for f in CLAUDE.md PRD.md DESIGN.md README.md feature_list.json docs/PROGRESS.md docs/prd-analysis.md docs/architecture.md; do
  check "$( [ -f "$f" ] && echo true || echo false )" "$f exists"
done

# 4. Architecture layers
echo "■ Architecture Layers"
check "$( [ -d src/lib/services ] && echo true || echo false )" "Services layer exists"
check "$( [ -d src/lib/repositories ] && echo true || echo false )" "Repositories layer exists"
check "$( [ -d src/app/api ] && echo true || echo false )" "API routes exist"

# 5. Component layer clean
echo "■ Layer Violations"
VIOLATIONS=$(grep -r "supabase" src/components/ 2>/dev/null | wc -l)
check "$( [ $VIOLATIONS -eq 0 ] && echo true || echo false )" "No Supabase imports in components ($VIOLATIONS found)"

# 6. Disclaimer on all pages
echo "■ Disclaimer System"
for p in src/app/page.tsx "src/app/[state]/[slug]/page.tsx" src/app/compare/page.tsx; do
  HAS=$(grep -c "Disclaimer" "$p" 2>/dev/null)
  check "$( [ $HAS -gt 0 ] && echo true || echo false )" "Disclaimer in $p"
done

# 7. SEO pages count
echo "■ SEO Pages"
PAGES=$(find .next/server -name "*.html" 2>/dev/null | wc -l)
check "$( [ $PAGES -gt 400 ] && echo true || echo false )" "400+ static pages generated ($PAGES found)"

echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] && echo "VERDICT: ALL PASS" || echo "VERDICT: $FAIL FAILURES"
