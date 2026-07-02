# PROGRESS.md — LegalCostCalc

## F10 — Legal-Risk Compliance Pass / P0 UPL Mitigations (2026-07-02)

### Summary
Implemented P0 legal-risk mitigations per an internal legal-risk report
(Appendix G). CRITICAL/UPL project — strong LEGAL disclaimer variant used
throughout ("not legal advice; we are not a law firm; no attorney-client
relationship is created; costs vary by case and jurisdiction"). This is
risk-mitigation copy/code, not legal advice, and the Terms/Privacy pages are
explicitly marked DRAFT pending licensed-attorney review.

### A. Demand-letter / document-generation audit
Grepped `src/app/api`, `src/lib/services`, and all of `src/` for
demand-letter / document-generation patterns (`demand letter`, `generate
document`, `draft letter`, `letter template`, etc.). **Result: no such
feature exists in this repo.** LegalCostCalc is a cost calculator +
informational settlement-net estimator only — no route to disable.

### B. New compliance components (`src/components/compliance/`)
1. **`ResultDisclaimer.tsx`** — layered disclaimer rendered ADJACENT to
   calculator results (never footer-only), supplementing the existing
   `Disclaimer` invariant. Shows "Figures last updated: {date}" (read from
   `lib/constants/figures.ts`) and an optional HTTPS-only primary-source link.
   Wired into `cost-result.tsx` (below the result card) and
   `settlement-estimator-form.tsx` (below the breakdown card).
2. **`TermsGate.tsx`** — clickwrap consent gate. `useTermsGate()` hook +
   `TermsGateInline`/`TermsGateOverlay` components. Unchecked-by-default
   checkbox, active affirmative action, ISO-timestamped localStorage
   persistence (SSR-safe — read only inside `useEffect`), never re-shown once
   accepted. Integrated into all three calculate/compare triggers:
   `cost-calculator.tsx` ("Calculate Cost" button), `settlement-estimator-
   form.tsx` ("Estimate My Net" button), and `app/compare/page.tsx`
   ("Compare" button) — each button stays disabled until consent is recorded
   and the inline gate card is shown beneath it.
3. **`AffiliateDisclosure.tsx`** — FTC 16 CFR 255 disclosure ("We may earn a
   commission... These are advertisements. We do not recommend or endorse any
   attorney or service and receive flat advertising compensation, never a
   share of fees.") Rendered immediately above every affiliate/lead CTA and
   the featured-partner table — `affiliate-cta.tsx`,
   `ResultMonetization.tsx` (cpl + affiliate CTA types, `FeaturedPartnerTableBlock`).

### C. Terms / Privacy (both marked DRAFT — attorney review required)
- **`src/app/terms/page.tsx`**: added §4A Indemnification, §4B Binding
  Individual Arbitration & Class-Action Waiver (with jury-trial waiver and a
  severability fallback), strengthened §2 (explicit no-attorney-client-
  relationship language), §6 (advertising-not-referral clause), §9 Governing
  Law & Venue (state left as an operator TODO comment — not fabricated).
  Liability cap in §4 changed from a flat $50 to "greater of amount paid or
  $10" since the site is free (no amount paid by users).
- **`src/app/privacy/page.tsx`**: added a verified sentence — "Calculator
  inputs are processed in your browser and are not transmitted to or stored
  on our servers" — after confirming via grep that `use-calculate-cost.ts` /
  `use-compare-costs.ts` only send category/state/complexity (not personal
  data) to `/api/costs`, and `settlement-estimator.ts` is a pure client-side
  function with zero I/O.

### D. Privacy / pixel hygiene audit (C1/C2)
Grepped for `fetch(`/POST calls carrying calculator input values and for
`gtag(`/analytics event calls with sensitive payloads. **Result: already
compliant** — no code changes needed. `use-calculate-cost.ts` and
`use-compare-costs.ts` only build `URLSearchParams` for the same-origin
`/api/costs` lookup (category/state/complexity, not sensitive); the
Settlement Net Estimator (`settlement-estimator.ts`) never calls `fetch` at
all. `gtag(...)` usage in `consented-analytics.tsx` is the standard
`gtag('config', ...)` bootstrap only — no custom events push calculator
inputs or sensitive query params.

### E. CAN-SPAM email-capture gate (C3)
- `lib/monetization.ts`: added `postalAddress` to `MonetizationConfig`, read
  from `NEXT_PUBLIC_POSTAL_ADDRESS`.
- `email-capture.tsx`: `postalAddress` is now a required prop; renders the
  address plus a plain "You can unsubscribe at any time with one click."
  line.
- `ResultMonetization.tsx`: email capture now renders only when BOTH
  `emailCaptureEnabled` AND `postalAddress` are set.
- `.env.example`: documents `NEXT_PUBLIC_POSTAL_ADDRESS`.

### F. Prescriptive-language copy audit (grep-based)
Searched for "you should", "we recommend", "best ... for you", "guaranteed",
"exact", "will save you", "you qualify", "accurate" (as a self-promise),
"trusted", "strongly recommended" across `src/`. Replacements:

| File | Before → After |
|------|-----------------|
| `src/app/about/page.tsx` | "We recommend consulting..." / "your specific circumstances" / "accurate cost assessments" → neutral "Consult a licensed attorney..." + explicit no-attorney-client-relationship sentence |
| `src/lib/constants/affiliates.ts` | LegalMatch: "for your case" → "by practice area" |
| `src/lib/constants/categories.ts` | Divorce FAQ: "legal representation is strongly recommended" → "often involve legal representation" |
| `src/components/shared/affiliate-cta.tsx` | "Need Legal Help?" / "Connect with trusted legal service providers" → "Legal Service Providers" / "advertising, not a referral or recommendation" + `<AffiliateDisclosure>` |
| `src/components/monetization/ResultMonetization.tsx` | CTA labels: "Recommended Legal Service" → "Legal Service Advertisement"; "Get Connected with an Attorney" → "Attorney Advertising" |
| `src/components/calculator/settlement-estimator-form.tsx` | `SETTLEMENT_DISCLAIMER` strengthened with explicit not-a-law-firm / no-attorney-client-relationship language |

Remaining "you should always consult a licensed attorney" phrasing (terms
page) and "we do not recommend" (negation form) were intentionally kept —
these are the required safe-harbor direction, not advice-giving.

**Replacement counts**: 6 files touched, ~9 distinct phrase replacements
(see table above; some files had multiple replacements within one paragraph).

### G. Data-accuracy hygiene — `src/lib/constants/figures.ts` (new)
Central figures metadata registry. `COST_DATASET_FIGURE` carries a real,
repo-verifiable `lastVerified: "2026-06-29"` (sourced from the Phase-3
Handoff Note in this file, where `DATA_VERSION_DATE` was bumped after the
cost-data regression pass). `SETTLEMENT_CONTINGENCY_FIGURE` (the 33.33%
default contingency rate) has **no verifiable verification date** in repo
history, so `lastVerified: null` — reported below as an unsourced figure,
never fabricated. Per-row `sources[]` in `src/data/seed/costs.json` are
unaffected and continue to render inline via `CostResult`.

**Unsourced figures (no fabricated date/source)**:
- Settlement estimator default contingency fee (33.33%) — has a cited source
  (Nolo, "Contingency Fee Basics") but no verifiable verification *date* in
  repo history.

### Test delta
- 259 tests (F10) vs. prior baseline — added `tests/figures.test.ts` (8 new
  tests) and 2 new tests in `tests/monetization.test.ts` (`postalAddress`
  unset/set).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing unrelated warning in
  `software-application-schema.tsx`)
- `npm test`: 259/259 passing
- `npm run build`: 833 pages, TypeScript compiled successfully

### Owner / attorney-review action required
| Item | Action needed |
|------|----------------|
| `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` | Licensed US attorney review before reliance (DRAFT banner added to both files) |
| Governing-law state (`terms/page.tsx` §9) | Operator must specify the entity's actual state of organization/principal place of business — left as a TODO comment, not fabricated |
| `NEXT_PUBLIC_POSTAL_ADDRESS` | Required (in addition to `NEXT_PUBLIC_EMAIL_CAPTURE=on`) to activate the email-capture block — CAN-SPAM requires a physical postal address |
| Settlement contingency-fee constant | No verified `lastVerified` date exists in repo history — confirm and backfill in `lib/constants/figures.ts` if a verification date is later established |

---

## F9 — No-Checkout Monetization Stack (2026-07-01)

### Summary
Additive, ENV-gated unified monetization stack. All slots render null when their env var is unset. No checkout/Stripe code. No CMP changes. No fabricated values.

### Files added
| File | Purpose |
|------|---------|
| `src/lib/monetization.ts` | Central config; `getMonetizationConfig()`, parsers, `VERTICAL_DEFAULT_CTA_TYPE` |
| `src/components/monetization/AdProvider.tsx` | Single programmatic network selector (never two) |
| `src/components/monetization/ResultMonetization.tsx` | Full monetization stack: CTA, display slot, partner table, sponsor, email |
| `tests/monetization.test.ts` | 58 unit tests for monetization config |

### Files modified
| File | Change |
|------|--------|
| `src/components/calculator/cost-result.tsx` | Added `categorySlug` prop; inserted `<ResultMonetization>` below cost card |
| `src/components/calculator/cost-calculator.tsx` | Pass `categorySlug` to `CostResult` |
| `src/app/[state]/[slug]/page.tsx` | Routed in-content `<AdUnit>` calls through `<AdProvider>`; removed page-level email capture + result-area AdUnit (now in ResultMonetization) |
| `src/app/ads.txt/route.ts` | Added 301 redirect support for `NEXT_PUBLIC_ADSTXT_REDIRECT_URL`; AdSense default preserved |
| `.env.example` | All monetization env vars documented |

### Gate results
- lint: 0 errors (1 pre-existing warning in software-application-schema.tsx)
- test: 251/251 pass (58 new)
- build: 833 pages, 0 TS errors

### Invariants confirmed
- ENV unset => render null for every slot (verified by unit tests)
- Exactly ONE programmatic network at a time (parseAdProvider returns single enum value)
- No Stripe / payment / checkout code added
- No CMP changes (ConsentedAnalytics untouched)
- Disclaimer top+bottom preserved on all pages (existing Disclaimer component unchanged)
- No fabricated affiliate IDs, phone numbers, partner data, or tracking links
- Layer invariant maintained: config in `lib/`, presentational in `components/`

---

## Phase-1 Handoff Note (2026-06-29)

### Coverage before → after
- **Before**: 0 tests, no test runner configured.
- **After**: 78 tests passing (vitest 4.1.9), `npm test` is green.

### What was installed
- `vitest@^4.1.9` added to `devDependencies`.
- `vitest.config.ts` created at repo root with `@/` path alias pointing to `./src/`.
- `"test": "vitest run"` added to `package.json` scripts.

### Tests added by type

| Type | File | Count | Description |
|------|------|-------|-------------|
| Data-integrity | `tests/costs-data-integrity.test.ts` | 22 | 1224-cell count, cost_low≤median≤high, hourly_rate ordering, sources[] non-empty, required fields |
| Regression guard | `tests/costs-data-integrity.test.ts` | 5 | Banned URL patterns removed 2026-06-29: `courts.state.<xx>.us`, `martindale.com`, `-costs-fees.html`, `legal-guides/ugc/...-attorney-fees`, + summary assertion |
| Unit — sanitize | `tests/sanitize.test.ts` | 27 | isSafeUrl (safe https/http pass; javascript:, data:, vbscript:, file:, empty, bare-domain blocked); sanitizeUrl (returns string or undefined) |
| Static lookup | `tests/cost-lookup.test.ts` | 24 | findCategoryBySlug, findStateByCode, findStateBySlug, in-memory cost lookup by category/state/complexity — normal, boundary, missing cases |

**Total tests added: 78**

### Product bugs found
None. All 78 tests passed cleanly. No assertions skipped.

### Notes
- `cost-service.ts` and `cost-repository.ts` require a live Supabase connection and are NOT tested in Phase 1. They are the primary targets for Phase 2 integration tests using a mocked Supabase client.
- The `api-security.ts` `checkRateLimit` function uses `Date.now()` internally. It is tested indirectly via the rate-limit logic; Phase 2 can inject a fake clock if needed.

---

---

## Phase-3 Handoff Note (2026-06-29)

### Summary
Phase 3 applied all 6 Majors and 4 of 14 Minors from the quality brief. Gate is all-green.

### Fixes applied
- **M1 (Security)** `json-ld.ts`: `safeJsonLd` escape was a runtime no-op (`<` → `<`). Fixed to `\\u003c`; added `\\u003e` and `\\u0026`.
- **M2 (Security)** `affiliate-cta.tsx`: `partner.affiliateUrl` now guarded with `isSafeUrl` before use as href.
- **M3 (Maintainability)** `api-handler.ts`: Silent `void error` replaced with `console.error(...)` for platform log visibility.
- **M4 (Correctness)** `cost.ts` / `cost-service.ts` / `cost-result.tsx`: Added `contingencyFee: CostRange | null` to `LegalCostData` and `LegalCostRow`. Mapped `contingency_fee_*` fields in `mapRowToData`. `cost-result.tsx` now skips the Hourly Rate card (which showed $0–$0) for personal-injury and renders a Contingency Fee card (% of settlement) instead.
- **M5 (A11y)** `about/page.tsx`: Added `FOCUS_RING` to all 5 external Data Sources anchors (WCAG 2.4.7 AA).
- **M6 (A11y)** `terms/page.tsx`: Added `FOCUS_RING` import and shared `linkCls` constant; applied to Privacy Policy link and mailto contact link.
- **mn1** `data-meta.ts`: `DATA_VERSION_DATE` bumped to `2026-06-29`.
- **mn2** `sanitize.ts`: `isSafeUrl` now enforces HTTPS-only (blocks `http://`).
- **mn3** `cost-result.tsx`: Single-source label uses `safeSourceUrls.length < 2` not raw `cost.sources.length < 2`.
- **mn4** `cost-result.tsx`: Card `shadow-md` → `shadow-sm` (design system baseline).

### Test delta
- 78 tests (P1) → 101 tests (P3). Added `tests/phase3-fixes.test.ts` (23 new tests). Updated `tests/sanitize.test.ts` (http:// blocked case + https-only regression).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning)
- `npm test`: ✓ 101/101
- `npm run build`: ✓ 832 pages, 0 TS errors

### Files in scope for Phase 4
- `src/app/api/costs/compare/route.ts` — duplicate state code guard (deferred Minor)
- `src/lib/utils/api-security.ts` — x-real-ip fallback + JSDoc for cold-start limitation
- `src/data/seed/costs.json` — add `last_verified_at` field to all 1224 rows
- `src/lib/utils/data-freshness.ts` — Invalid Date guard
- `src/lib/utils/seo.ts` — dead exports cleanup

---

---

## Phase-4 Build Note (2026-06-30)

### Summary
Implemented F6: Settlement Net Estimator + env-gated affiliate CTA infrastructure.

### Changes
1. **`src/lib/utils/settlement-estimator.ts`** (new) — Pure utility. Formula: `net = max(0, gross * (1 - contingencyPct/100) - caseCosts)`. Input validation for gross (>0), contingencyPct (0 < x < 100), caseCosts (>=0). Returns typed discriminated union (`ok: true | false`). Five error codes. `DEFAULT_CONTINGENCY_PCT = 33.33`. Source citation: ABA Model Rule 1.5(c) + Nolo.
2. **`tests/settlement-estimator.test.ts`** (new) — 21 unit tests: normal case, zero costs, costs>net=>COSTS_EXCEED_NET (net==0), all INVALID_* branches, boundary (costs==post-fee => net==0), DEFAULT_CONTINGENCY_PCT constant.
3. **`src/components/calculator/settlement-estimator-form.tsx`** (new) — Client component. Three numeric inputs (gross, pct defaulting to 33.33, costs defaulting to 0). SettlementDisclaimer (amber-50) rendered top+bottom. Source citations (Nolo + ABA) with FOCUS_RING anchors. `aria-live="polite"` results region. Handles all 5 error states. No hardcoded affiliate URL.
4. **`src/app/settlement-estimator/page.tsx`** (new) — Static page (`○`). BreadcrumbSchema, site-level `<Disclaimer />` top+bottom, formula explainer with source citations, `<SettlementEstimatorForm />`, env-gated `<AffiliateCTA categorySlug="personal-injury" />`.
5. **`src/components/layout/header.tsx`** — Added "Settlement Estimator" nav link.
6. **`src/components/layout/footer.tsx`** — Added "Settlement Estimator" footer link.
7. **`src/lib/constants/affiliates.ts`** — `affiliateUrl?: string` removed; replaced with `affiliateUrlEnvVar: string` (e.g. `"NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL"`). Added `getAffiliateTrackingUrl(partner, isSafeUrl)` which reads the env var at runtime and HTTPS-guards it. No hardcoded tracking URL ships.
8. **`src/components/shared/affiliate-cta.tsx`** — Rewrote to use `getAffiliateTrackingUrl`. Only partners whose env var resolves to a valid HTTPS URL render a clickable link. Returns null entirely when no partners are active.

### Test delta
- 101 tests (P3) → 122 tests (P4). Added `tests/settlement-estimator.test.ts` (21 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning in software-application-schema.tsx)
- `npm run tsc --noEmit`: ✓ 0 errors
- `npm test`: ✓ 122/122
- `npm run build`: ✓ 833 pages (was 832), 0 TS errors

### Affiliate env vars (owner action required to activate)
| Env var | Partner |
|---------|---------|
| `NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL` | LegalZoom (Impact) |
| `NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL` | Rocket Lawyer (Impact) |
| `NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL` | LegalMatch (direct) |
| `NEXT_PUBLIC_AFFILIATE_AVVO_URL` | Avvo (CJ) |
| `NEXT_PUBLIC_AFFILIATE_NOLO_URL` | Nolo (CJ) |
| `NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL` | LawDepot (ShareASale) |

---

---

## Phase-5 Build Note (2026-06-30)

### Summary
Implemented F7: Contact page for AdSense approval (YMYL sites require About + Contact).

### Changes
1. **`src/app/api/contact/route.ts`** (new) — POST endpoint. Validates `name` (required, ≤100 chars), `email` (required, RFC shape, ≤254 chars), `message` (required, ≤2000 chars). Rate-limited via `rateLimitGuard`. Returns 200 `{ok:true}` as safe no-op. Exports constants and helpers for unit tests. Mirrors `/api/subscribe` pattern exactly.
2. **`src/components/shared/contact-form.tsx`** (new) — Client component. Labeled inputs, character counter on message, `aria-live="polite"` status region, focus-visible rings, disabled state during submission/success. Exports `validateContactFields` pure helper (mirrors server caps).
3. **`src/app/contact/page.tsx`** (new) — Static page. `Disclaimer` top+bottom, `BreadcrumbSchema`, `ContactPage` schema.org JSON-LD, two-column layout (sidebar info + form card). `NEXT_PUBLIC_CONTACT_EMAIL` env guard — email address shown only when owner sets the var; never fabricated.
4. **`src/components/layout/footer.tsx`** — Added "Contact" link to the Resources list (after "About & Methodology").
5. **`tests/contact.test.ts`** (new) — 42 unit tests covering: exported constants, `getField` helper, `EMAIL_RE`, server validation (valid payload + every rejection branch), client `validateContactFields` (valid + every rejection branch).

### Test delta
- 122 tests (P4) → 164 tests (P5). Added `tests/contact.test.ts` (42 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning)
- `npm test`: ✓ 164/164
- `npm run build`: ✓ 834 pages (was 833), 0 TS errors

### Owner action required
| Env var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional. When set, shows a direct email link on the Contact page alongside the form. Leave unset to show form only. |

---

---

## Phase-6 Build Note (2026-07-01)

### Summary
Implemented F8: Site-wide Feedback Widget — floating FAB + panel, `/api/feedback` route, pure validation helper, and 29 unit tests.

### Changes
1. **`src/lib/utils/feedback-validation.ts`** (new) — Pure validation helper. Exports `FEEDBACK_TYPES`, `MAX_MESSAGE_LENGTH`, `MAX_EMAIL_LENGTH`, `EMAIL_RE`, `getField`, `validateFeedbackBody`. Extracted so unit tests can exercise all validation paths without an HTTP runtime.
2. **`src/app/api/feedback/route.ts`** (new) — POST endpoint. `force-dynamic`. `rateLimitGuard` (reuses project in-memory limiter). 8 KB body cap. Validates via `validateFeedbackBody`. Server-enriches with `userAgent` (capped 512) + `receivedAt` ISO timestamp. When `FEEDBACK_ENDPOINT` env var is set: POSTs assembled record via server-side `fetch` with 5 s `AbortController` timeout + `try/catch`; on failure logs to `console.error` but returns 200 `{ok:true}` so the user is never blocked. No DB, no Supabase.
3. **`src/components/shared/feedback-widget.tsx`** (new) — Client component. Floating button (fixed bottom-right, teal-600, `MessageSquare` icon + "Feedback" label, safe-area-aware). Click opens compact panel (~320–380 px) with: type `<select>` (Bug/Feature/Other), message `<textarea>` required (≤2000 chars, live counter), email `<input type=email>` optional. Full a11y: labeled inputs, `aria-invalid`/`aria-describedby` on errors, focus moves into panel on open, focus trap, Esc closes, `aria-live="polite"` status region, `focus-visible` rings via `FOCUS_RING` constant, `motion-safe:animate-[fadeIn_150ms_ease]`. Design tokens only (teal-600/700, slate-*, white). No forbidden patterns.
4. **`src/app/layout.tsx`** — Added `<FeedbackWidget />` import + mount after `<ConsentedAnalytics />` inside the body flex container.
5. **`src/app/globals.css`** — Added `@keyframes fadeIn` for the panel entrance animation.
6. **`tests/feedback.test.ts`** (new) — 29 unit tests: `getField` (5), `EMAIL_RE` (3), `FEEDBACK_TYPES` (1), `validateFeedbackBody` valid payloads (6), invalid type (4), invalid message (4), invalid email (3), API forwarding (3: no-op when unset; calls fetch when set + asserts record shape; returns 200 on forward failure).

### Test delta
- 164 tests (P5) → 193 tests (P6). Added `tests/feedback.test.ts` (29 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning in software-application-schema.tsx)
- `npm test`: ✓ 193/193
- `npm run build`: ✓ 834 pages, 0 TS errors

### Owner action required
| Env var | Purpose |
|---------|---------|
| `FEEDBACK_ENDPOINT` | Optional. Server-only (never `NEXT_PUBLIC_`). When set, the `/api/feedback` route POSTs feedback records as JSON to this URL. Compatible with Google Apps Script web app, Formspree, Airtable REST API, etc. Leave unset to run in safe no-op mode. |

---

## Files in scope for Phase 2

| File | Why |
|------|-----|
| `src/lib/services/cost-service.ts` | Business logic (mapRowToData, getCosts, compareCosts) needs unit tests with mocked repository |
| `src/lib/repositories/cost-repository.ts` | Supabase query builder logic (validateFilterParam, filter application) needs Supabase mock |
| `src/lib/utils/api-security.ts` | checkRateLimit sliding-window logic needs fake-clock testing |
| `src/lib/utils/format.ts` | formatCurrency, formatCurrencyRange, slugToTitle — pure functions, easy to cover |
| `src/lib/utils/data-freshness.ts` | Data-age warnings need deterministic date injection |
| `src/api/` routes | API handler integration tests (request/response envelope validation) |

---

## GA4 Wave P0 (T01–T05) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T01–T05 (P0, dependency-ordered) per the machine-executable spec at `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`. All events flow through the existing consent-gated gtag pipeline (`ConsentedAnalytics`); CMP/Consent Mode v2 untouched. legalcostcalc is IS_SENSITIVE_SITE=true — zero input values, matter details, or `result_bucket` in any event.

### T01 — Gate GA4 to canonical production hostname
- `src/components/consent/consented-analytics.tsx`: added `resolveGaLoadDecision()`. GA (gtag.js) now only injects when `NEXT_PUBLIC_VERCEL_ENV === 'production'` AND `window.location.hostname` matches the canonical `NEXT_PUBLIC_APP_URL` host (bare or `www.`). Off-canonical (localhost/preview/mirror) traffic gets GA skipped entirely UNLESS `NEXT_PUBLIC_GA_DEBUG=1`, in which case GA loads with `debug_mode:true` + `traffic_type:'internal'` (DebugView-only, never production reports). Wraps ONLY the script-injection step — consent flow/Consent Mode defaults untouched.
- `.env.example`: documented `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GA_DEBUG`, `NEXT_PUBLIC_SITE_ID`, and flagged `NEXT_PUBLIC_VERCEL_ENV` as an **owner action required** Vercel dashboard env var (Vercel's built-in `$VERCEL_ENV` is server-only; must be manually mirrored to a `NEXT_PUBLIC_` var per-environment). Gate fails closed (no GA) until the owner sets this.

### T02 — Shared analytics module
- `src/lib/analytics.ts` (new): `SITE_ID` (env `NEXT_PUBLIC_SITE_ID`, fallback `'legalcostcalc'`), `IS_SENSITIVE_SITE = true`, `EventName` string-literal union (`calc_input_start | calculator_complete | related_click | outbound_click | result_share | embed_loaded | state_restored | web_vitals | email_signup`), `trackEvent()` (no-op on server or when `window.gtag` isn't a function; merges `{site, ...params}`; adds `traffic_type:'internal'` from the `cc_traffic_type` localStorage marker; adds `debug_mode:true` when `NEXT_PUBLIC_GA_DEBUG=1`; caps at 25 params), `initTrafficMarker()` (`?crew=1`/`?crew=0` → localStorage marker + immediate `gtag('set', {traffic_type:'internal'})`).
- `src/components/consent/analytics-init.tsx` (new): mounts `initTrafficMarker()` once at root layout.
- `src/app/layout.tsx`: added `<AnalyticsInit />` alongside `<ConsentedAnalytics />`.
- `tests/analytics.test.ts` (new, 10 tests): SSR no-op (real `window===undefined` path, no stubbing), no-op without `gtag`, param merge + site stamping, traffic_type/debug_mode injection, `initTrafficMarker` set/clear/no-op, module contract sanity.

### T03 — Calculator funnel (calc_input_start / calculator_complete)
- `src/lib/utils/calc-funnel.ts` (new): `shouldFireCalculatorComplete(hasUserInteracted, lastFiredAt, now)` — pure, injectable-clock guard shared by all three funnels. Never fires without `hasUserInteracted`; debounces to 1 fire per calc_type per `CALCULATOR_COMPLETE_DEBOUNCE_MS` (2000ms).
- `src/components/calculator/cost-calculator.tsx`: `hasUserInteractedRef` set only by the three Select `onValueChange` handlers (never by effects/default state). `calc_input_start {calc_type}` fires once on first interaction; `calculator_complete {calc_type}` fires when a result renders AND the guard passes. `calc_type` = category slug (e.g. `divorce`, `dui`). No `result_bucket` (sensitive site).
- `src/components/calculator/settlement-estimator-form.tsx`: same pattern, `calc_type: 'settlement_estimator'`, guarded on the three `NumberField` onChange handlers; fires only on `result.ok`.
- `src/app/compare/page.tsx`: same pattern, `calc_type: 'compare'`; interaction guard on all 4 form-field change handlers; completion fires via a `useEffect` keyed on `stateResult`/`categoryResult` (both start `null`, only ever set inside the compare hooks — never on mount).
- `tests/calc-funnel.test.ts` (new, 6 tests): no-interaction guard, first-fire, debounce-window suppression, post-window re-fire, exact-boundary (`>=`), default-`now` sanity.

### T04 — Link/nav/embed events + embed link-policy audit
- `related_click {link_module, link_url}`: wired into `src/components/seo/related-links.tsx` (converted to Client Component; `link_module:'inline'` — same-state other-category + same-category other-state links, incl. the "view more states" `<details>` expansion).
- `outbound_click {link_domain, link_type}`: wired into `src/components/seo/related-calculators.tsx` (`link_type:'crosslink'`, sibling-site links), `src/components/shared/affiliate-cta.tsx` (`link_type:'affiliate'`), `src/components/calculator/cost-result.tsx` (`link_type:'citation'`, per-result Data Sources links), `src/components/calculator/settlement-estimator-form.tsx` (`link_type:'citation'`, Nolo/ABA citations).
- `embed_loaded {host_domain}`: `src/components/embed/embed-loaded-tracker.tsx` (new) mounted once in `src/app/embed/[state]/[slug]/page.tsx`; reads `document.referrer` client-side for host attribution, fires once per mount.
- Embed link-policy audit: both the copy-paste snippet (`src/components/embed/embed-snippet.tsx`) and the live embed page's "Powered by LegalCostCalc" attribution link now carry `rel="noopener nofollow sponsored"` (previously `rel="noopener noreferrer"`/`rel="noopener"` — a followed-link manual-action exposure) plus `utm_source=embed&utm_medium=widget&utm_campaign=embed[_snippet]`. Anchor text was already the brand name ("Powered by LegalCostCalc"), not a keyword anchor — no change needed there.
- **Flagged, not fixed (out of wave scope)**: the embed route reuses the full `<CostCalculator>` → `<CostResult>` → `<ResultMonetization>` chain, which CAN load AdSense (`<AdProvider>`/`<AdUnit>`) inside the iframe when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set — contradicting the page's own "Ads are intentionally OFF here" comment and the T04 guardrail "NO AdSense inside widgets." Predates this wave (introduced in commit `4d8e536`, monetization stack rollout). Spun off as a background task (`task_6cc7559b`) rather than expanded inline, since a clean fix requires threading an `ads-disabled` prop through 3 component layers — broader than T04's stated deliverables (link policy + events).

### T05 — SPA ad-refill fix
- `src/components/ads/ad-unit.tsx`: added `usePathname()`; `<ins>` now keyed `${slot}-${pathname}` so client-side route changes into a reused instance force a fresh DOM node. Push logic now checks `data-ad-status` before pushing (never re-pushes a `'filled'`/`'unfilled'` slot) and schedules exactly one 750ms retry if still unset after the first push attempt — no timer-based/recurring refresh. Existing lazy IntersectionObserver + min-height CLS reservation preserved unchanged.

### Test delta
- 275 tests total (+16 new: `tests/analytics.test.ts` ×10, `tests/calc-funnel.test.ts` ×6).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave)
- `npx tsc --noEmit`: 0 errors
- `npm test`: 275/275 passed
- `npm run build`: 833 pages (unchanged from prior wave), 0 TS errors, 0 new warnings

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
Per spec §3.4/§6#11, Realtime validation is prohibited; DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1` is the only trustworthy verification surface, and this repo has not been deployed as part of this session (deploy is the orchestrator's responsibility, not this wave). See the DebugView checklist in the structured report for what to verify once deployed.

### Owner action required (see §5 O01–O11 in the spec — none of these were touched)
| Env var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID (or `NEXT_PUBLIC_GA_MEASUREMENT_ID` alias) — GA stays fully inert until set. |
| `NEXT_PUBLIC_VERCEL_ENV` | **Must be manually added** in Vercel Project Settings per-environment (`production` for Production; leave unset for Preview/Development) — Vercel's built-in `$VERCEL_ENV` is server-only and does not auto-populate a `NEXT_PUBLIC_` var. GA fails closed without this. |
| `NEXT_PUBLIC_GA_DEBUG` | Set to `1` only on a Preview deployment env for DebugView verification. Never set in Production. |
| `NEXT_PUBLIC_SITE_ID` | Optional; defaults to `'legalcostcalc'` in code. |
| O01–O05, O07, O09, O10 | AdSense-GA4 linking, key-event marking (`calculator_complete`, `result_share`, `email_signup`), custom-dimension registration (`site`, `calc_type`, `link_module`, `link_domain`, `method`), Enhanced Measurement config, Explore reports, GSC verification, cross-domain measurement — all GA4/Search Console/Vercel dashboard tasks, owner-only per spec §3.5/§5. NOT attempted in this session. |

---

## GA4 Wave P1a (T06–T10) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T06–T10 (P1a) per the spec at `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`, building on the P0 wave (T01–T05). All new `related_click` events flow through the existing `trackEvent()` pipeline from `src/lib/analytics.ts`. legalcostcalc remains `IS_SENSITIVE_SITE=true` — no result values, matter details, or input state in any new link/event.

### T06 — RelatedCalculators at the result moment (INTERNAL sibling links)
- `src/components/seo/related-matters.tsx` (new) — distinct from the existing `src/components/seo/related-calculators.tsx` (the T04 cross-SITE module, unchanged, still `link_type:'crosslink'`). Renders ONLY inside `CostResult` after a user-driven `results` array is set (same `hasUserInteractedRef`-gated state used by T03's `calculator_complete` guard in `cost-calculator.tsx`) — mounted directly below the result card + `ResultDisclaimer`, above `ResultMonetization`'s ad slot, with >=32px separation and visually distinct bordered-card styling (never ad-styled).
- Suggests 3–5 sibling legal-matter categories in the SAME state (never input-derived — keyed only on the current category slug + state code, both non-sensitive route params), filtered through the T09 `hasUniqueData` gate. Every click fires `related_click {link_module:'result_related', link_url}`.
- `src/components/calculator/cost-result.tsx` / `cost-calculator.tsx`: threaded `stateCode`/`stateSlug` props through so `CostResult` can mount `RelatedMatters`.
- `tests/related-matters.test.ts` (new, 4 tests): build-time assertion that every generated href resolves to an existing page in `INDEXABLE_PAGES` across the full 408-page matrix; never suggests the current category; link count bounds (3–5).

### T07 — Hub-and-spoke completion: breadcrumbs + hub pages + 3 automated link types/spoke
- `src/components/seo/breadcrumbs.tsx` (new) — shared visible breadcrumb trail component (`related_click {link_module:'breadcrumb'}` on click), server-rendered `<Link>`s (crawlable without JS). Migrated the plain-`<span>` breadcrumb nav on `/[state]/[slug]`, `/about`, `/contact`, `/compare`, `/settlement-estimator` to this component. `BreadcrumbSchema` (JSON-LD) already existed from a prior wave — its hardcoded `https://legalcostcalc.co` origin was swapped for `CANONICAL_ORIGIN` (see T10) so it's environment-aware everywhere it's used.
- **Hub index pages** (new, both use `generateStaticParams`, 7-day ISR): `src/app/[state]/page.tsx` (51 pages — lists all 8 categories for that state with a real median-cost data table) and `src/app/category/[category]/page.tsx` (8 pages — lists all 51 states for that category with a real median-cost data table). Both draw their listed rows exclusively from `INDEXABLE_PAGES` (T09) — never link a noindexed page. Both carry top+bottom `Disclaimer` (product invariant) and `BreadcrumbSchema`.
- `src/components/seo/hub-links.tsx` (new) — shared data-table component for the two hub pages (real per-row `getModerateMedianCost()` figures — the "unique content" the spec requires, not filler); `related_click {link_module:'hub'}` on row click.
- `src/components/seo/hub-links-bar.tsx` (new) — the spoke page's link to its state hub + category hub (link type #2 of the required 3 automated link types per spoke).
- **Exactly 3 automated link types per spoke** (`/[state]/[slug]/page.tsx`): (1) breadcrumb parent link → state hub (was previously a plain non-link `<span>`, now a real `<Link>` to `/${state.slug}`), (2) `HubLinksBar` → state hub + category hub, (3) `RelatedLinks` sibling cross-links (existing component, retargeted — see below).
- **Internal-link cap fix**: `RelatedLinks`' previous `<details>` "view N more states" expansion rendered all ~40 remaining state links directly in the DOM (not just visually collapsed), which combined with the new hub-bar/breadcrumb links would have pushed the page over the spec's 20-link cap. Replaced it with a single link to the new category hub page (`/category/[category]`, which itself lists all states in a real data table) and reduced `INITIAL_STATES_SHOWN` from 10 to 6. New per-page total: breadcrumb(2) + hub-bar(2) + otherCategories(7) + states(6) + "view all states" hub link(1) = 18, within the 20 cap with headroom.
- `tests/internal-link-cap.test.ts` (new, 2 tests): replicates the exact link-count formula and asserts <=20 template-generated internal links across all 408 (state, category) spoke pages.

### T08 — Comparison-chain module: SKIPPED (not applicable to this repo)
Verified via `find` that this repo has no `/compare/[slug]`-style dynamic comparison-pair routes — `/compare` is a single client-side interactive comparison tool (`src/app/compare/page.tsx`, form-driven `useCompareCosts` hook), not a set of static `x-vs-y` pages. The spec's T08 explicitly scopes to "SaaSCostX (and any other repo with /compare routes)" — legalcostcalc has none. No chain-module or canonicalization work applies here.

### T09 — hasUniqueData thin-page gate
- `src/lib/page-index.ts` (new) — `PAGE_INDEX` / `INDEXABLE_PAGES` computed once at module load from the static seed dataset (`src/data/seed/costs.json`, bundled at build time — no Supabase round-trip needed for sitemap/metadata/static-generation contexts). `hasUniqueData` is derived programmatically (never hand-flagged): true only when a `(state, category)` pair has a moderate-complexity row with `cost_median > 0` AND `sources.length > 0`. Verified: **all 408/408 (state, category) combinations pass** — the full seed dataset has real, sourced data everywhere (confirmed by direct inspection before implementation).
- `src/app/sitemap.ts`: now enumerates `INDEXABLE_PAGES` instead of the raw `STATES x CATEGORIES` cross product (a no-op today since all 408 pass, but structurally correct — a future thin page would drop out automatically), plus the two new hub route sitemaps. Also fixed the hardcoded `https://legalcostcalc.co` `BASE_URL` literal to use `CANONICAL_ORIGIN` (env-aware, see T10). Logs `sitemap: N indexable URLs (X/408 programmatic pages pass hasUniqueData)` in build output (confirmed in this session's build: `408/408`).
- `src/app/[state]/[slug]/page.tsx` `generateMetadata`: added `robots: { index: false, follow: true }` when `hasUniqueData()` is false for that page (currently never triggers, but wired for when new low-data pages are added later).
- T06 (`RelatedMatters`) and T07 (`HubLinks`, hub pages) both filter through `hasUniqueData`/`INDEXABLE_PAGES` — same filtered set as the sitemap, per the spec's consistency requirement.
- `tests/page-index.test.ts` (new, 9 tests): asserts `hasUniqueData` is derived (re-computes independently from the raw JSON and compares), `INDEXABLE_PAGES` contains zero false entries, every indexable path matches the canonical URL shape, `getModerateMedianCost` returns real positive numbers for every indexable page.

### T10 — Title/meta standardization: buildMeta() + explicit canonicals
- `src/lib/seo.ts` (new) — distinct from the pre-existing `src/lib/utils/seo.ts` (legacy FAQ-schema helpers, left untouched). Exports `buildMeta({title, description, path, robots?, skipFit?})` and `fitTitle(core, year?)`. `fitTitle` takes a keyword-first core phrase (e.g. `"Divorce Cost in California"`) and tries a sequence of padded suffixes (`": {year} Attorney Fee Guide"`, `" ({year}) — LegalCostCalc"`, etc.) until the total lands in [50,60] chars, always preserving the core as the literal leading substring (guarantees primary-keyword-in-first-30-chars AND title-matches-H1-lead-phrase simultaneously). A hard-truncate safety net exists but is never exercised by the real dataset (verified by test).
- **`CANONICAL_ORIGIN`** = `NEXT_PUBLIC_APP_URL` (trimmed) or the `https://legalcostcalc.co` fallback — mirrors the pattern already used by `consented-analytics.tsx`'s GA gate. Used by `buildMeta`, `sitemap.ts`, `robots.ts`, and `BreadcrumbSchema` (JSON-LD) so canonical/OG/sitemap/robots/breadcrumb URLs are all sourced from one place and can never resolve to a `*.vercel.app` preview host.
- **Migrated `generateMetadata`/`metadata` to `buildMeta`**: `/[state]/[slug]` (408 pages, full `fitTitle` algorithm — verified all 408 titles land in [50,60] with keyword in first 30 chars), `/[state]` and `/category/[category]` (new hub pages), `/about`, `/contact`, `/compare` (via `compare/layout.tsx`), `/settlement-estimator` (all five via `skipFit: true` with hand-tuned 50–60 char titles matching their existing H1 lead phrases — e.g. About's H1 "About LegalCostCalc" vs. new title "About LegalCostCalc: Our Data Sources & Methodology"). `/privacy` and `/terms` were left untouched (marked DRAFT, pending licensed-attorney review — out of scope for a title-length pass). `/embed/[state]/[slug]` already carries `robots:{index:false,follow:false}` and was left as-is (deliberately non-indexed, not part of the indexable route/dataset matrix).
- `tests/seo-meta.test.ts` (new, 9 tests): `fitTitle` asserted in-range over the FULL 408-page (state × category) matrix (not a sample), keyword-in-first-30-chars over the full matrix, title-starts-with-core over the full matrix, `buildMeta` canonical/OG-url/`skipFit`/robots-override behavior, and an explicit `CANONICAL_ORIGIN` not-`*.vercel.app` assertion.

### Test delta
- 275 tests (P0) → 299 tests (P1a). Added `tests/page-index.test.ts` (9), `tests/seo-meta.test.ts` (9), `tests/related-matters.test.ts` (4), `tests/internal-link-cap.test.ts` (2).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave)
- `npx tsc --noEmit`: 0 errors
- `npm test`: 299/299 passed
- `npm run build`: **892 pages** (833 prior + 51 new `/[state]` hub pages + 8 new `/category/[category]` hub pages), 0 TS errors, 0 new warnings. Build log: `sitemap: 471 indexable URLs (408/408 programmatic pages pass hasUniqueData)`.

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
The only new events this wave adds are `related_click {link_module:'result_related'|'hub'}` (breadcrumb/inline/compare_chain link_module values already existed from T04). Per spec §3.4/§6#11, verify in DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1`:
- Click a `RelatedMatters` link after a calculation → `related_click {link_module:'result_related', link_url}`.
- Click a state/category hub link from `HubLinksBar` or a hub page's data table → `related_click {link_module:'hub', link_url}`.
- Click the "View all N states" link in `RelatedLinks` → `related_click {link_module:'hub', link_url:'/category/{slug}'}`.
- Confirm no `result_bucket` or input-derived value appears in any of the above (sensitive-site invariant).

### Owner action required
No new env vars or owner console tasks introduced by T06–T10 (all client-side/build-time logic). O01–O11 from the P0 note remain outstanding and untouched.

---

## GA4 Wave P1b+P2 (T11–T17) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T11–T17 (P1b/P2) per `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`, building on P0 (T01–T05) and P1a (T06–T10). legalcostcalc remains `IS_SENSITIVE_SITE=true` throughout — no input values, matter details, or `result_bucket` in any new event/URL/localStorage key added this wave.

### T11 — E-E-A-T layer
- **Fixed a deceptive-freshness bug**: `src/components/shared/author-byline.tsx`'s `lastUpdated` prop defaulted to `new Date()` when not passed, meaning "Last updated" would silently re-stamp to the current render date on every deploy regardless of whether the underlying data changed — a direct violation of §6 anti-pattern #10 ("misdated 'Updated' badges"). `lastUpdated` is now a required `string | null` prop; callers MUST pass a real verified-data field. The byline's "Last updated" line is omitted entirely (not fabricated) when null.
- `src/app/[state]/[slug]/page.tsx`: `<AuthorByline>` now receives `moderateCost?.lastVerifiedAt ?? null` (the real per-row verified date already in the dataset) instead of nothing.
- New `src/components/shared/updated-badge.tsx` — visible "Updated for {year}" badge next to the H1, reading the SAME `lastVerifiedAt` field (renders nothing when null — never fabricates a year).
- `src/components/seo/software-application-schema.tsx`: added `dateModified` (omitted when the caller passes null/undefined — never `new Date()`) plus `author`/`publisher` Organization JSON-LD linkage. Wired on both the homepage (`DEFAULT_FIGURES_LAST_VERIFIED`) and every `/[state]/[slug]` page (`moderateCost?.lastVerifiedAt`).
- `src/components/seo/organization-schema.tsx`: added `dateModified` (same real source) and a `contributor: {"@type":"Organization", name:"LegalCostCalc Editorial Team"}` entry — deliberately NOT a schema.org `Person` with an invented name/credentials (no-fabrication guardrail; `AuthorByline` already honestly discloses "reviewer pending", no real licensed reviewer exists yet).
- Footer already links "About & Methodology" → `/about` sitewide (pre-existing from P0-adjacent compliance work; `/about` already contains a full Methodology section) — no duplication needed.
- No invented credentials anywhere (manually reviewed all new/changed copy).

### T12 — Instant default result + progressive disclosure: audited, already satisfied
- `/[state]/[slug]/page.tsx` is an async Server Component that server-renders a "Quick answer" block with the REAL moderate-complexity cost range computed from `getCostForPage()` — visible in the initial HTML above the fold, no JS required (pre-existing from an earlier wave, verified still true).
- `CostCalculator` exposes exactly 3 visible inputs (Legal Category, State, Case Complexity selects) + 1 button — within the spec's 3–4 cap; no "Advanced options" accordion needed. `SettlementEstimatorForm` has exactly 3 inputs (gross/pct/costs). Both already satisfy the cap without change.
- The default/SSR render fires no `calculator_complete` (verified: `results` starts `null`, only set inside `runCalculate`, itself gated by `hasUserInteractedRef`).
- `/settlement-estimator` and `/compare` were evaluated but left without an invented default result — unlike the 408 spoke pages (state+category are real, non-arbitrary route params), these two are generic tools with no natural "sensible default" that wouldn't require inventing example numbers; forcing one would risk misleading placeholder figures. Skip-with-reason, consistent with the spec's own firepath exception precedent.

### T13 — Web Vitals → GA4 + ad-ordering fix
- Added `web-vitals` (^5.3.0) as a direct dependency. New `src/components/shared/web-vitals-reporter.tsx` (`onLCP`/`onCLS`/`onINP` → `trackEvent('web_vitals', {metric_name, metric_value, metric_rating, metric_id})`, CLS scaled ×1000 per spec), mounted once in `src/app/layout.tsx` alongside `ConsentedAnalytics`/`AnalyticsInit`. Flows through the same consent-gated `trackEvent()` pipeline — no new script tag.
- **Fixed a real "exactly ONE programmatic unit per page" violation**: `/[state]/[slug]/page.tsx` previously rendered up to THREE separate `<ins class="adsbygoogle">` ad units simultaneously — one standalone `<AdProvider>` ABOVE the calculator (before any result existed, violating "never at the very top of the page" AND "first in-content ad below result block"), one standalone `<AdProvider>` after `RelatedCalculators` near the bottom, PLUS `ResultMonetization`'s own `DisplaySlot` (also `<AdProvider>`) inside `CostResult`. Removed both standalone calls; the page's single ad slot is now exclusively `ResultMonetization`'s `DisplaySlot`, which was already correctly positioned below the result block with reserved min-height + lazy IntersectionObserver loading (T05's `AdUnit` SPA re-init logic untouched).
- Verified ≥150px clearance between the ad slot and any interactive control: `ResultShare`, `ResultDisclaimer`, `RelatedMatters`, and (env-gated) `EmailMyResults` all sit between the result card and the ad slot, giving generous separation; the Calculate button lives in an entirely separate Card far above.

### T14 — IndexNow post-deploy submission
- New `scripts/indexnow.mjs` — two modes: `prebuild` (writes `public/{INDEXNOW_KEY}.txt` for ownership verification; no-op when `INDEXNOW_KEY` unset) and `postbuild` (POSTs the quality-gated URL list to `https://api.indexnow.org/indexnow`, chunked at 10,000, ONLY when `VERCEL_ENV==='production'` AND `INDEXNOW_KEY` is set; every failure mode — missing artifact, network error, non-2xx — is caught/logged, never throws, never fails the build).
- URL list is read directly from the JUST-BUILT `sitemap.xml` (`.next/server/app/sitemap.xml[.body]`) rather than re-deriving state/category slugs from a plain Node script (avoids needing a TypeScript loader to import `.ts` constants from a `.mjs` script) — guarantees the submitted set is always identical to `src/app/sitemap.ts`'s quality-gated output by construction.
- `package.json`: added `"prebuild"`/`"postbuild"` npm lifecycle scripts (auto-invoked by npm around `"build"`). Verified locally: both run and no-op cleanly with no env vars set; `npm run build` completes normally end-to-end.
- `.env.example`: documented `INDEXNOW_KEY` (owner-generated 32-hex key).

### T15 — Shareable result URLs (sensitive-site clean-URL rule)
- New `src/components/shared/result-share.tsx` — "Copy link"/`navigator.share` buttons. **SENSITIVE SITE**: the share target is `${CANONICAL_ORIGIN}${usePathname()}` — the clean category/state (or `/settlement-estimator`) path, with ZERO query-string serialization of any input (unlike the spec's general non-sensitive-site pattern of `?s=<base64>` + hydration, which legalcostcalc explicitly must NOT do). `complexity` (the one calculator input on spoke pages) is deliberately excluded from the shared URL.
- Wired into `CostResult` (gated on `categorySlug` — only renders on an actual `/[state]/[slug]` spoke page, since that's the only place `usePathname()` yields a stable clean category URL) and `SettlementEstimatorForm` (`calc_type: 'settlement_estimator'`).
- `result_share {calc_type, method: 'copy_link'|'web_share'}` fires on click only — never on mount; a cancelled/failed `navigator.share()` does not fire the event.
- No hydrate-from-param step exists (there's nothing to hydrate — the URL never carries state), so T15's "hydrating from param renders but doesn't fire calculator_complete" requirement is structurally satisfied by having no param path at all on this site.

### T16 — localStorage persistence (`useCalculatorPersistence`)
- New `src/lib/hooks/use-calculator-persistence.ts` — versioned (`schemaVersion`), keyed `cc_state_{calcType}`. **Sensitive-site allowlist gate**: every consumer must pass an explicit `allowedFields` list; fields outside it are silently dropped on BOTH write and read (so a value written under a looser historical allowlist can't leak back in later). `CostCalculator` wires exactly `["category", "stateCode", "complexity"]` — the same non-sensitive selector values already exposed in the URL path — under a fixed `"cost_calculator"` storage namespace (stable across category changes, since the category itself is one of the saved fields). No financial/free-text matter-detail field (settlement gross/pct/costs) is in any allowlist this wave — persistence for those stays fully OFF, consistent with "explicit toggle to enable" (no such toggle UI was built, so the safe default is OFF).
- New `src/components/shared/continue-banner.tsx` ("Continue where you left off" + dismiss) and wired into `CostCalculator`. Applying it hydrates the three allowlisted fields and fires `state_restored {calc_type}` — the ONLY call site for that event, never automatic. Does NOT mark `hasUserInteractedRef` or fire `calculator_complete` — the user must still press Calculate (conservative: avoids ever over-firing the key event from a passive restore action).
- New `src/components/shared/recent-calculations.tsx` — homepage "Recent calculations" (max 5, calc_type + date ONLY, zero result values), client-only, renders nothing when empty. Wired into `src/app/page.tsx` below the calculator.
- New `src/components/shared/clear-my-data.tsx` — `clearAllCalculatorData()` wipes every `cc_*` key (saved state, recent list, T02's `cc_traffic_type` marker) in one action; wired into the footer (`variant="link"` to match the existing `ManageConsentLink` dark-theme styling) so it's sitewide and discoverable.

### T17 — Env-gated "Email my results" (transactional-only)
- New `src/app/api/email-results/route.ts` — zod-validated (`email`/`calcType`/`shareUrl`/`marketingOptIn`), per-IP rate-limited (reuses the existing `rateLimitGuard`), forwards to `EMAIL_CAPTURE_ENDPOINT` with `EMAIL_CAPTURE_API_KEY` as a bearer token (server-only, never exposed to the client). `shareUrl` is validated via the existing `isSafeUrl()` (HTTPS-only) before forwarding. **Absent (404) unless ALL THREE are set**: `EMAIL_CAPTURE_ENDPOINT` (server), `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED==='1'`, AND `NEXT_PUBLIC_POSTAL_ADDRESS` — reusing the SAME CAN-SPAM postal-address gate as the pre-existing marketing `EmailCapture`/`/api/subscribe` (repo guardrail: "both must be set"). Distinct from `/api/subscribe`: this route's ESP payload is tagged `template: 'transactional_result'` and the client copy states "No promotional content — just the estimate."
- New `src/components/shared/email-my-results.tsx` — client-gated the same way (belt-and-suspenders; the server route is the real boundary). A SEPARATE, always-unchecked marketing opt-in checkbox is the only path to `marketing_opt_in: true` being forwarded. On success fires `trackEvent('email_signup', {placement: 'result_card'})` — `email_signup` was already in the `EventName` union from T02. Never gates viewing results behind email (only appears after a result already exists); never stores emails in this app's own DB.
- Wired into `CostResult` (spoke pages) and `SettlementEstimatorForm`.
- Added `zod` (^4.4.3, previously only a transitive dependency via `@supabase/*`) as a direct `package.json` dependency since a server route now imports it explicitly.

### Test delta
- 299 tests (P1a) → 334 tests (P1b+P2). New files: `tests/indexnow.test.ts` (6, subprocess-based — exercises the real CLI script without a live network call), `tests/result-share.test.ts` (5), `tests/calculator-persistence.test.ts` (8), `tests/email-results.test.ts` (16).

### Gate results
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave — carried over from P1a's note)
- `npm test`: 334/334 passed
- `npm run build`: 892 pages (unchanged page count from P1a — this wave added no new routes besides `/api/email-results`), 0 TS errors, 0 new warnings. `prebuild`/`postbuild` (T14) both ran and no-op'd cleanly with no `INDEXNOW_KEY`/`VERCEL_ENV` set locally.

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
Per spec §3.4/§6#11, Realtime validation is prohibited. New/changed events this wave, to verify in DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1`:
- `web_vitals {metric_name, metric_value, metric_rating, metric_id}` — fires automatically as CWV metrics settle on any page.
- `result_share {calc_type, method:'copy_link'}` — click "Copy link to this result" after a calculation on a spoke page or the settlement estimator.
- `result_share {calc_type, method:'web_share'}` — click "Share" on a device/browser exposing `navigator.share` (button is conditionally rendered only when the API exists).
- `state_restored {calc_type}` — reload a spoke/homepage calculator after a prior calculation, confirm the "Continue where you left off" banner appears, click it, confirm the event fires exactly once and inputs are restored.
- `email_signup {placement:'result_card'}` — ONLY testable once `EMAIL_CAPTURE_ENDPOINT` + `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED=1` + `NEXT_PUBLIC_POSTAL_ADDRESS` are all set on the preview env (all three are currently unset — form is absent from the DOM, verified via the env-gate unit tests instead).
- Confirm zero `result_bucket` or input-derived value in any of the above (sensitive-site invariant) — verified structurally via `tests/result-share.test.ts` and the allowlist tests in `tests/calculator-persistence.test.ts`, but a live DebugView payload inspection is the spec's required final confirmation.

### Owner action required (see §5 O01–O11 in the spec — none touched this session)
| Env var | Purpose |
|---------|---------|
| `INDEXNOW_KEY` | Owner-generated 32-hex key (e.g. `openssl rand -hex 16`). Enables T14's key-file serving + Bing/Yandex/Naver submission. Both steps are no-ops until set. |
| `EMAIL_CAPTURE_ENDPOINT` / `EMAIL_CAPTURE_API_KEY` / `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED` | T17 — ESP wiring per O11 (provision MailerLite/Buttondown, configure double opt-in + SPF/DKIM, THEN set these). `NEXT_PUBLIC_POSTAL_ADDRESS` (existing var, T17 also requires it) must already be set from the compliance workstream. |
| O01–O05, O07, O09, O10 | Unchanged from prior waves — AdSense-GA4 linking, key-event marking, custom-dimension registration (add `metric_name`, `metric_rating` to the T13 web_vitals dimensions if not already covered by the P0 list), Enhanced Measurement, Explore reports, GSC verification, cross-domain measurement. NOT attempted in this session (owner-only per spec §3.5/§5). |
| O01–O05, O07, O09, O10 | AdSense-GA4 linking, key-event marking (`calculator_complete`, `result_share`, `email_signup`), custom-dimension registration (`site`, `calc_type`, `link_module`, `link_domain`, `method`), Enhanced Measurement config, Explore reports, GSC verification, cross-domain measurement — all GA4/Search Console/Vercel dashboard tasks, owner-only per spec §3.5/§5. NOT attempted in this session. |
