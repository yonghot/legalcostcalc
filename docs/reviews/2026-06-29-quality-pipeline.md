# Quality Pipeline Review — 2026-06-29

**Repo**: legalcostcalc  
**Phase**: 3 (cleanup/fix)  
**Engineer**: Claude Sonnet 4.6  
**Gate result**: ALL GREEN (lint ✓ · typecheck ✓ · test 101/101 ✓ · build 832 pages ✓)

---

## Fixes Applied

### MAJORS (all 6 fixed)

| ID | Area | File | Fix summary |
|----|------|------|-------------|
| M1 | Security | `src/lib/utils/json-ld.ts` | `safeJsonLd` was a no-op — `.replace(/</g, "<")` replaced `<` with itself. Fixed to `\\u003c` (literal 6-char sequence). Also added `\\u003e` and `\\u0026` escapes. |
| M2 | Security | `src/components/shared/affiliate-cta.tsx` | `buildAffiliateUrl` returned `partner.affiliateUrl` verbatim. Now guarded with `isSafeUrl(partner.affiliateUrl)`. Falls through to UTM-tagged URL on failure. Added `isSafeUrl` import. |
| M3 | Maintainability | `src/lib/utils/api-handler.ts` | Catch block executed `void error` silently. Replaced with `console.error('[api-handler] Unhandled error:', error)` for Vercel platform log visibility. |
| M4 | Correctness | `src/lib/types/cost.ts`, `src/lib/services/cost-service.ts`, `src/components/calculator/cost-result.tsx` | Personal-injury rows show `$0–$0` hourly rate. Added `contingencyFee: CostRange | null` to `LegalCostData`, mapped `contingency_fee_*` fields in `mapRowToData`, and updated `cost-result.tsx` to skip the Hourly Rate card when all hourly values are 0 and instead render a Contingency Fee card (% of settlement). |
| M5 | Accessibility | `src/app/about/page.tsx` | Five external Data Sources anchor tags had no `focus-visible` ring. Added `FOCUS_RING` to all five via shared `srcLinkCls` local constant. WCAG 2.4.7 AA. |
| M6 | Accessibility | `src/app/terms/page.tsx` | Privacy Policy link (line 163) and mailto contact link (line 205) had no focus ring. Added `FOCUS_RING` import and shared `linkCls` constant. WCAG 2.4.7 AA. |

### MINORS applied (4 of 14)

| ID | Area | Fix summary |
|----|------|-------------|
| mn1 | Correctness | `DATA_VERSION_DATE` bumped from `2026-04-11` to `2026-06-29` in `data-meta.ts`. |
| mn2 | Security | `isSafeUrl` now enforces HTTPS-only (`parsed.protocol === "https:"` only). Blocks plain `http://` links. Updated JSDoc. |
| mn3 | Correctness | `cost-result.tsx` line 133 — single-source label now uses `safeSourceUrls.length < 2` (safe-filtered count) instead of `cost.sources.length < 2` (raw count). |
| mn4 | Design | `cost-result.tsx` card `shadow-md` → `shadow-sm` (design system baseline per design/forbidden.md which caps at `shadow-sm/shadow-md`; cards use `shadow-sm` as base). |

### MINORS skipped (10 of 14)

| ID | Reason skipped |
|----|----------------|
| Compare API duplicate state codes | Low-risk but out of scope for P3; no existing test covers this path and the fix needs careful badRequest import check. |
| checkDataFreshness Invalid Date guard | Minor defensive code; existing tests don't exercise this path; safe to defer. |
| Rate limiter x-real-ip fallback | Infrastructure concern, no test coverage; defer to P4 ops review. |
| script-src nonce migration | Major CSP architecture change; requires Next.js nonce middleware; out of P3 scope. |
| seo.ts dead exports | Cleanup-only; zero functional impact; defer. |
| sanitizeUrl / DISCLAIMER_SHORT dead exports | `sanitizeUrl` IS used in tests; leaving it. `DISCLAIMER_SHORT` defer to P4. |
| In-memory rate limiter JSDoc | Documentation-only; defer. |
| Source labels opaque ('Source 1') | UX improvement but not a correctness bug; defer. |
| costs.json last_verified_at missing | 1224-row seed data change; requires schema migration; defer to ops. |
| shadow-md design spec | Already fixed as mn4. |

---

## Test Delta

| File | Before | After | Notes |
|------|--------|-------|-------|
| `tests/sanitize.test.ts` | 27 tests | 28 tests | http:// added to blocked-cases; regression test for https-only |
| `tests/phase3-fixes.test.ts` | new | 23 tests | safeJsonLd escaping, contingency fee data integrity, DATA_VERSION_DATE |
| **Total** | **78** | **101** | +23 net |

---

## Gate Results

```
npm run lint   → ✓ (1 pre-existing warning in seo schema component; 0 errors)
npm test       → ✓ 101/101 passing
npm run build  → ✓ 832 static pages generated, 0 TS errors
```

---

## Key Technical Notes

1. **safeJsonLd root cause**: In TypeScript source, `"<"` is a JavaScript Unicode escape that evaluates to `<` (U+003C) at parse time. The compiled JS was literally `replace(/</g,"<")` — no-op. The fix uses `"\\u003c"` (two chars: backslash + u003c) which produces the 6-character escape sequence in the output string.

2. **Contingency fee rendering**: The fix uses the cleanest signal — "all three hourly values are 0" — to detect contingency-basis categories, which matches exactly the personal-injury seed data pattern. Other categories always have non-zero hourly rates.

3. **isSafeUrl https-only**: All external source URLs in `costs.json` already use `https://`. The about/terms pages already used https-only links. The change therefore has no visible behavioral impact on current data but prevents future http:// links from appearing.
