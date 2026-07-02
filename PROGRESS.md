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

## P0 - Ad Revenue Maximization: Audits (K02-K05) + Reviewer Byline (K06) + Divorce Hub (K07) (2026-07-03)

### Summary
Implements the ad-revenue-maximization spec's section 9 tasks K02, K03, K04,
K05 (wave P0-AUDITS, in that order), K06 (YMYL reviewer byline infra), and
K07 (July seasonal build queue priority #2: divorce-cost-by-state hub). K01,
K08-K11 are explicitly OUT OF SCOPE for this wave. No AdSense loader, Auto-ads
state, ads.txt, or ad-push semantics were touched - audits only, plus one new
additive page and one new env-gated byline slot.

### K03 - Ad/search crawler accessibility audit (code-side)
Grepped `middleware.ts`, `next.config.ts`, `src/lib/utils/api-security.ts`
(the only rate limiter in the repo), and all of `src/` for any UA-based
gating, bot-challenge, WAF/firewall, or CAPTCHA logic. Result: no bot-gating
code path exists anywhere in this repo.
- `middleware.ts` only sets a non-blocking geo cookie (`visitor_country`) and
  explicitly excludes `api|_next/static|_next/image|favicon.ico|ads.txt|robots.txt|sitemap.xml|opengraph-image`
  from its matcher - it never inspects or filters by User-Agent, and never
  returns a non-200/redirect response.
- `src/lib/utils/api-security.ts`'s `checkRateLimit`/`rateLimitGuard` (60
  req/min per IP) is wired ONLY into `/api/contact`, `/api/costs`,
  `/api/costs/compare`, `/api/email-results`, `/api/feedback`,
  `/api/subscribe` - none of which are crawler-facing surfaces (ads.txt,
  page routes, sitemap.xml are all untouched by it).
- `robots.ts` allows `/` for all UAs, disallows only `/api/`.
- `src/app/ads.txt/route.ts` serves unconditionally (no UA check) - either
  the AdSense publisher line or a redirect to `NEXT_PUBLIC_ADSTXT_REDIRECT_URL`
  when set, never a 4xx/challenge.
- No `vercel.json` exists in the repo (confirmed via directory listing), so
  no Vercel-level firewall/bot-challenge config is in play either.
- The live curl checks (Mediapartners-Google/AdsBot/Googlebot -> 200) already
  passed at the orchestrator level per the task brief; this audit found
  nothing in the codebase that could contradict that at the code level.
- No changes made (nothing to whitelist - there is no gate to widen).

### K04 - SPA re-initialization / refresh-adjacency audit
Traced every ad push/init call site: `src/components/ads/ad-unit.tsx` is the
ONLY place `window.adsbygoogle.push({})` is called in the repo (confirmed via
repo-wide grep). Its push-triggering `useEffect` dependency array is
`[client, active, pathname]`, and the `<ins key={slot-pathname}>` remount key
is ALSO pathname-only - so a push can only ever be triggered by a real route
change, never by any other state transition. Verified this holds for every
interactive path in the two calculator surfaces that render an ad slot
(`CostCalculator` -> `CostResult` -> `ResultMonetization` -> `DisplaySlot` ->
`AdProvider` -> `AdUnit`, used on `/` and `/[state]/[slug]`;
`SettlementEstimatorForm` was also checked and has ZERO ad call sites):
- Recalculation (`runCalculate`/`handleCalculate` in `cost-calculator.tsx`,
  `runCalculate` in `settlement-estimator-form.tsx`): only sets local React
  state (`results`/`output`) - never touches `pathname`, never remounts
  `AdUnit`. No re-push.
- Category/state/complexity select toggles: `onValueChange` handlers only
  call `setCategory`/`setStateCode`/`setComplexity` - same as above, no
  pathname involvement.
- localStorage-restore re-render (`handleApplySavedState` ->
  `persistence.restore()` in `use-calculator-persistence.ts`): applies saved
  fields via `setCategory`/`setStateCode`/`setComplexity` only; fires
  `state_restored` but never touches the URL, router, or pathname.
- Share-URL / `history.replaceState`: repo-wide grep for
  `replaceState|window.history` found matches ONLY in unrelated files
  (privacy page copy, TermsGate/consent-banner localStorage,
  `clear-my-data.tsx`, `recent-calculations.tsx`, `lib/analytics.ts`,
  `use-calculator-persistence.ts`) - zero matches in any ad, calculator, or
  share component. `ResultShare` (`src/components/shared/result-share.tsx`)
  reads `usePathname()` only to build a copy-link URL; it never calls
  `router.push`/`replaceState`, so a share action cannot trigger a pathname
  change or an ad re-push.
- Tabs/accordions: no tab or accordion UI exists in either calculator
  (`CostCalculator`/`SettlementEstimatorForm` are flat forms; no
  `Tabs`/`Accordion` primitive is used on either page).
- This structural guarantee was already fully in place before this wave (see
  the ad-unit.tsx docstring and the T13 comments in
  `src/app/[state]/[slug]/page.tsx`, which record a PRIOR wave removing two
  standalone `<AdProvider>` call sites specifically to enforce "exactly ONE
  programmatic ad unit per page, placed only below the result"). No code
  changes were needed - added `tests/ad-proximity.test.ts` (new) covering
  the CostCalculator/SettlementEstimatorForm structural guarantee as
  regression coverage (this test file's primary purpose is K05, see below,
  but its "no ad marker in pre-calculation render" assertions double as K04
  evidence that no ad exists to erroneously re-push in the first place).

### K05 - Ad-proximity ("no accidental click") audit
Verified via `tests/ad-proximity.test.ts` (new, 4 tests, all passing):
1. In `CostResult`'s SSR output, the `adsbygoogle` marker only ever appears
   AFTER "Estimated Total Cost" (the result content) - never before it.
2. `ResultMonetization`'s wrapper carries `mt-8 space-y-6`, and its
   `DisplaySlot` reserves `min-h-[90px]` (mobile) / `min-h-[250px]` (sm:+) -
   a real, non-zero spacing+reservation buffer well over the spec's ~150px
   guidance, verified structurally rather than just visually.
3. `CostCalculator`'s pre-calculation render (inputs + "Calculate Cost"
   button) contains zero ad markers - `CostResult`/`ResultMonetization`
   aren't even mounted until a result exists.
4. `SettlementEstimatorForm` (its own "Estimate My Net" button) has zero
   `AdUnit`/`AdProvider` call sites at all - confirmed via source grep, so
   there is no proximity risk on `/settlement-estimator` regardless of
   Auto-ads configuration.
- Added a passive `data-ad-exclusion-zone="calculator-widget"` DOM attribute
  (no visual/behavioral change) to the inputs+button `Card` in both
  `cost-calculator.tsx` and `settlement-estimator-form.tsx`, and wrote
  `docs/ad-exclusion-zones.md` documenting the selector for the owner to
  register in AdSense Auto ads' page-level CSS-selector exclusion tool
  (console action - not performed here).

### K02 - Indexable page-depth audit
Baseline (BEFORE this wave's K07 addition): 471 indexable URLs - 408
`/[state]/[slug]` spokes (all 408/408 state x category pairs pass
`hasUniqueData`, confirmed by `tests/page-index.test.ts`'s existing coverage
log and by direct inspection of `costs.json`: every row has a real
`cost_median > 0` and a non-empty `sources[]`), 51 state hubs, 8 category
hubs, and 4 static pages (home, compare, about, embed) - well above the
15/site benchmark cited in the spec, and confirmed via a real `npm run build`
(`sitemap.ts`'s own `console.log` line). Zero `hasUniqueData=false` pages
exist in this repo - there is no borderline-page backlog to upgrade with real
data (every state x category pair already has sourced simple/moderate/complex
rows). AFTER this wave: 472 indexable URLs (+1, the new
`/divorce-cost-by-state` hub added for K07 below) - confirmed by a second
`npm run build` run: `sitemap: 472 indexable URLs (408/408 programmatic pages
pass hasUniqueData)`.

### K06 - YMYL reviewer-byline infra (env/config-driven)
New `src/lib/reviewer.ts` - `getReviewerConfig()` reads
`NEXT_PUBLIC_REVIEWER_NAME` (+ optional `NEXT_PUBLIC_REVIEWER_CREDENTIALS`),
returns `null` when unset/blank (no fabrication). Wired into:
- `src/components/shared/author-byline.tsx` - when a reviewer is configured,
  renders "Reviewed by {name}[, {credentials}]"; when unset, renders the
  EXACT SAME "(legal reviewer pending)" placeholder copy as before this wave
  (verified byte-for-byte via `tests/reviewer.test.ts`'s AuthorByline
  render-gate tests).
- `src/components/seo/organization-schema.tsx` - when configured, adds a
  `reviewedBy` schema.org `Person` entry alongside the existing (unchanged)
  `contributor: Organization` entry; when unset, the JSON-LD graph is
  byte-identical to before this wave.
- Documented both env vars in `.env.example` with an explicit no-fabrication
  warning (real reviewer sourcing is an owner action - this wave only wires
  the render path).
- New `tests/reviewer.test.ts` (10 tests): env-unset defaults, env-set exact
  passthrough (never transformed/invented), whitespace handling, and
  component-level render-gate assertions on `AuthorByline`.

### K07 - divorce-cost-by-state hub (July seasonal build queue, priority #2)
New static route `src/app/divorce-cost-by-state/page.tsx`:
- Tool-intent title: "Divorce Cost by State Calculator" (verified it contains
  "Calculator" and does not start with "what is" - the anti-pattern the spec
  explicitly bans).
- All-51-state comparison table (`src/components/seo/divorce-hub-table.tsx`,
  new): every row's uncontested/contested figures are the REAL `simple`/
  `complex` complexity-tier `cost_median` values from `costs.json` via a new
  `getCostByComplexity()` helper added to `src/lib/page-index.ts` - no
  interpolation, no invented numbers (verified in `tests/divorce-hub.test.ts`
  by spot-checking 5 states' rendered figures against the real seed values).
  Framed as simple=uncontested vs. complex=contested, matching the complexity
  semantics already used sitewide (the same selector on every spoke page's
  calculator).
- UPL-safe copy: disclaimer top+bottom intact (`Disclaimer` component, same
  as every other page), no advice-verb language anywhere on the page
  (`tests/divorce-hub.test.ts` asserts against "you should", "we recommend",
  "you need to", "will win", "guaranteed", etc.) - editorial copy explicitly
  states "This is general cost information only, not legal advice."
- Links to existing state spokes: every row links to the real,
  already-indexable `/[state]/divorce-cost` page.
- K06 integration: renders `AuthorByline`/`UpdatedBadge` using
  `DEFAULT_FIGURES_LAST_VERIFIED` (the same real dataset-verification date
  used sitewide) - never a fabricated freshness stamp.
- Added to `src/app/sitemap.ts` (priority 0.8, weekly) - confirmed present in
  the real build output as a static route.
- Cross-linked from every divorce spoke page's `HubLinksBar`
  (`src/components/seo/hub-links-bar.tsx` - new conditional third link,
  divorce-category-only, verified NOT to appear on non-divorce spokes).
- New supporting client components: `src/components/seo/divorce-hub-table.tsx`,
  `src/components/seo/divorce-hub-faq-link.tsx` (both follow the existing
  `HubLinks`/`Breadcrumbs` "server page + thin client wrapper for click
  tracking" pattern already used sitewide).
- New `tests/divorce-hub.test.ts` (11 tests).
- Does NOT touch `/category/divorce` (the existing generic per-category hub)
  - the new page is additive, framed differently (uncontested/contested vs.
  a single moderate-median column), and both stay live with distinct
  canonical URLs (no duplicate-content risk: different H1, different table
  columns, different copy).
- No new FAQ schema.org markup added (FAQ rich results ended per the spec -
  the FAQ section on this page is plain content, not JSON-LD).

### Test delta
- 350 tests (F10 baseline before this wave) -> 364 tests. New files:
  `tests/ad-proximity.test.ts` (4), `tests/reviewer.test.ts` (10),
  `tests/divorce-hub.test.ts` (11).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated to this wave, carried over
  from prior waves' notes)
- `npm test`: 364/364 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (up from 471),
  `/divorce-cost-by-state` built as a static route, no new TypeScript errors,
  no new warnings.

### Not touched (guardrails)
No AdSense loader/script, `ads.txt` route logic, Auto-ads console state, or
any ad-push/init semantics were modified. `AdProvider`'s single-network
invariant, the pathname-only re-init guard, and the below-result-only
placement are unchanged - this wave only added test coverage and
documentation confirming they already hold, plus one passive DOM marker
attribute. No commit/deploy performed (orchestrator-owned).

## K01 - On-Page Editorial Depth for Indexable Calculator Pages (2026-07-03)

### Summary
Implements K01 (the #1 approval lever, explicitly out of scope for the prior
P0-AUDITS wave): entity-level on-page editorial depth for every indexable
`/[state]/[slug]` spoke (408/408 pages passing `hasUniqueData`, 51 states x 8
categories). Adds a "How [Category] Costs Work" section, a per-state WORKED
EXAMPLE interpolated from the page's own real `costs.json` data, and a
VISIBLE (rendered `<dt>`/`<dd>` text, not JSON-LD-only) FAQ section reusing
the FAQ question/answer pairs the page already computes for `FaqSchema`.

### New: `src/components/seo/category-editorial.tsx`
Server component, zero client JS. Renders three sections below the
calculator/result area (after `RelatedCalculators`, before the bottom
`Disclaimer` — LCP and the calculator's ad-exclusion zone are unaffected):
1. **How [Category] Costs Work** — per-CATEGORY entity-level editorial from
   the new `categoryInfo.costFormationNotes` field (see below). Only this
   category's real cost-formation mechanics — never a noun-swapped template.
2. **Worked Example: [Category] in [State]** — built entirely from the
   page's own `costs` prop (the same `LegalCostData[]` the page already
   fetches via `getCostForPage`): median/low/high cost, an hourly-rate ->
   implied-billable-hours calculation, typical duration, top common fees,
   and a simple-vs-complex comparison. Every figure is read directly from
   the page's real data — nothing interpolated or invented. Renders nothing
   (no fabricated placeholder) when there is no moderate-complexity row.
3. **Frequently Asked Questions** — the SAME `faqQuestions` array the page
   already builds for `FaqSchema`'s JSON-LD, now ALSO rendered as visible
   `<dt>`/`<dd>` text. Previously this FAQ content existed only inside the
   invisible `<script type="application/ld+json">` block — a real content-
   depth gap for AdSense's "low-value tool-UI-only page" reviewer signal.
   4-6 questions per page (4 shared + up to 2 category-specific).

Component returns `null` (renders nothing) when there is no cost data AND no
`costFormationNotes` — no-fabrication guard, consistent with the rest of the
codebase's pattern (e.g. `CostDetailsSection`'s existing conditional guard).

### New: `categoryInfo.costFormationNotes` (`src/lib/types/category.ts`,
`src/lib/constants/categories.ts`)
Added a `costFormationNotes: string[]` field to `CategoryInfo` and populated
it with 2 distinct paragraphs per category (all 8: divorce, DUI, personal
injury, bankruptcy, real estate closing, estate planning/probate, criminal
defense, immigration) describing how THAT category's costs actually form —
e.g. divorce's contested-vs-uncontested + discovery/mediation/expert-witness
cost drivers; DUI's attorney-fee vs. non-attorney-cost (fines, interlock,
insurance) split; personal injury's contingency-fee mechanics; bankruptcy's
Chapter 7 vs. 13 billing difference; real estate's title/closing cost
stack; estate planning's pre-death-flat-fee vs. post-death-probate-billing
split; criminal defense's charge-severity/plea-vs-trial cost driver;
immigration's attorney-fee vs. federal-USCIS-fee split. Verified
programmatically (test) that no two categories share any text and that each
category's notes reference concepts specific to that practice area (e.g.
"BAC"/"ignition interlock" only in DUI, "USCIS"/"green card" only in
immigration) - this is the anti-scaled-content-trap guardrail from the spec.

### Wired into `src/app/[state]/[slug]/page.tsx`
Added `<CategoryEditorial categoryInfo stateInfo costs faqQuestions />`
after `RelatedCalculators` and before the final bottom `Disclaimer` -
reuses the page's existing `costs` and `faqQuestions` values rather than
recomputing or duplicating any data source. No other section was
restructured; `CostDetailsSection`, `HubLinksBar`, `RelatedLinks`,
`RelatedCalculators`, and both `Disclaimer` instances are unchanged.

### Word-count verification (`tests/category-editorial.test.ts`, 11 tests)
Since this repo's Supabase-backed cost data (`getCostForPage`) is not
reachable during a local build (see prior session's local-dev-quirks note -
`/[state]/[slug]` pages render their Supabase-dependent sections, including
the pre-existing `CostDetailsSection`, as empty-state copy in a local
`npm run build`), the word-count assertion targets `CategoryEditorial`
directly with REAL data drawn straight from `src/data/seed/costs.json` (the
same dataset the production Supabase table is seeded from) rather than
through the full page + a mocked network layer. This is the same
"seed-data-as-source-of-truth" pattern `tests/page-index.test.ts` and
`tests/divorce-hub.test.ts` already use. Confirmed via direct build-output
inspection that the "How Costs Work" and FAQ sections (both independent of
Supabase - they read only `categoryInfo` and template-derived FAQ text) DO
render correctly in the actual `.next` server HTML output for
`/alabama/divorce-cost`; the Worked Example section correctly renders
nothing in that same local build because `costs` is empty there (the
pre-existing Supabase-unreachable-locally condition, not a regression -
`CostDetailsSection`'s pre-existing "Common Fees"/"Attorney Hourly Rate"
sections are equally absent in the same local HTML for the same reason).
Assertions:
- Every category, rendered for a representative state (California) with its
  full real seed dataset, produces >= 400 words of visible text.
- A low-population state (Wyoming) also clears 400 words.
- Worked-example dollar figures match `formatCurrency` of the real
  `cost_median`/`cost_low`/`cost_high` seed values exactly, for 5 sampled
  (state, category) pairs.
- FAQ text renders as visible `<dt>`/`<dd>`, count is 4-6 per page.
- No advice-verb/outcome-prediction language (`you should`, `we recommend`,
  `guaranteed`, `will win`, etc.) appears in any category's rendered output.
- Tool-intent, distinct H2s ("How Divorce Costs Work", "Worked Example:
  Divorce in California", "Frequently Asked Questions") - not generic labels.
- Full 51-state x 8-category real-data coverage sweep renders without
  throwing for every pair that has seed data.

### Test delta
- 364 tests (P0-AUDITS baseline) -> 375 tests. New file:
  `tests/category-editorial.test.ts` (11).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated, carried over from prior
  waves)
- `npm test`: 375/375 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (unchanged - K01 is
  depth-only, no new pages, no `hasUniqueData` gate changes), all 408
  `/[state]/[slug]` static pages generated successfully.

### Not touched (guardrails)
No AdSense loader/script, ad-push/init semantics, `hasUniqueData` gate logic,
disclaimer copy/placement, or any compliance component were modified. No
new FAQ JSON-LD schema was added (the existing `FaqSchema` JSON-LD is
untouched - this wave only adds the human-visible rendering of the same
question/answer content, per the spec's "FAQ JSON-LD optional/harmless"
guidance). No commit/deploy performed (orchestrator-owned).

## Wave P1 - Discover Hygiene (K09) + Journey Ad Provider (K10) + Day-1
Runbook (K11) (2026-07-03)

### Summary
Implements the ad-revenue-maximization spec's section 9 tasks K09, K10, and
K11 for this repo. K06 (YMYL reviewer-byline infra) and K07 (July seasonal
build queue priority #2: divorce-cost-by-state hub) were verified
**already fully implemented and gate-green** in the prior P0 wave (see
"P0 - Ad Revenue Maximization" note above) - re-audited this wave and found
no regressions, no further changes needed, nothing re-done. K01-K05, K08 are
explicitly out of scope for this wave. No AdSense loader, Auto-ads state,
ads.txt, or ad-push semantics were touched.

### K06/K07 re-audit (no changes - confirming prior wave still holds)
- K06: `src/lib/reviewer.ts`'s `getReviewerConfig()` still gates
  `NEXT_PUBLIC_REVIEWER_NAME`/`NEXT_PUBLIC_REVIEWER_CREDENTIALS` correctly
  (unset -> honest "(legal reviewer pending)" placeholder; both env vars
  documented in `.env.example` with an explicit no-fabrication warning).
  `tests/reviewer.test.ts` (10 tests) still passing.
- K07: `/divorce-cost-by-state` still builds as a static route in the
  sitemap (472 indexable URLs, same as the prior wave's post-K07 count),
  still uses real `getCostByComplexity()` simple/complex seed-data lookups
  (no interpolation), still UPL-safe (disclaimer top+bottom, no advice-verb
  language), still tool-intent titled ("Divorce Cost by State Calculator").
  `tests/divorce-hub.test.ts` (11 tests) still passing. This wave's only
  *addition* to the K07 surface is the new OG image
  (`src/app/divorce-cost-by-state/opengraph-image.tsx`, part of K09 below)
  - the page content/copy/data itself is untouched.

### K09 - Discover hygiene
Two-part requirement: (1) `max-image-preview:large` robots directive on all
indexable pages, and (2) hub/insight pages get a >=1200px-wide, 16:9-ish OG
image built from real dataset figures.

**Part 1 - robots meta directive**:
- `src/app/layout.tsx`'s root `metadata.robots` now sets
  `"max-image-preview": "large"` alongside the existing `index: true, follow:
  true` - this is the sitewide default every page inherits UNLESS it passes
  its own explicit `robots` override (Next.js's `Metadata.robots` does NOT
  deep-merge across route segments - a child route's explicit robots object
  REPLACES the parent layout's entirely rather than merging with it).
- `src/lib/seo.ts`'s `buildMeta()` - the single helper nearly every route's
  metadata goes through - now injects `"max-image-preview": "large"` into
  ANY explicit `robots` override a caller passes (e.g. the T09 thin-page
  `noindex,follow` gate on `/[state]/[slug]` when `hasUniqueData` is false),
  so that override doesn't silently lose Discover-eligibility by replacing
  the layout's robots block. A caller-supplied `max-image-preview` value
  still wins if one is explicitly passed (verified in
  `tests/seo-meta.test.ts`'s new "caller intent takes precedence" test).
  `BuildMetaParams.robots` was narrowed from `Metadata["robots"]` (which
  includes the `string` shorthand form) to the object-only subtype so the
  merge is type-safe without a runtime check - every real call site in this
  repo already passes an object.
- `src/app/embed/[state]/[slug]/page.tsx`'s hand-rolled `noindex,nofollow`
  override (doesn't route through `buildMeta`) also now explicitly carries
  `"max-image-preview": "large"` for consistency, though it's a no-op in
  practice since the route is never crawled/indexed.
- Audited every other metadata call site: `/about`, `/category/[category]`,
  `/compare`, `/contact`, `/divorce-cost-by-state`, `/settlement-estimator`,
  `/[state]` all route through `buildMeta()` and pass no robots override
  (inherit the layout default as-is). `/`, `/embed`, `/privacy`, `/terms`
  hand-roll a `Metadata` object but declare no `robots` field, so they also
  inherit the layout default untouched.

**Part 2 - new OG images for hub/insight pages** (next/og `ImageResponse`,
edge runtime, matching the existing site pattern in
`src/app/opengraph-image.tsx` / `src/app/[state]/[slug]/opengraph-image.tsx`
- teal brand tokens, 1200x630, no purple/blue gradients):
- `src/app/[state]/opengraph-image.tsx` (new) - state-hub OG image. Key stat
  is the REAL median across that state's own indexable category costs,
  computed from `INDEXABLE_PAGES` + `getModerateMedianCost()` (the same
  source of truth `/[state]/page.tsx` itself renders from) - no fabricated
  or interpolated figures.
- `src/app/category/[category]/opengraph-image.tsx` (new) - category-hub OG
  image. Key stat is the REAL nationwide median across all 51
  states' costs for that category, same data source as the hub page.
- `src/app/divorce-cost-by-state/opengraph-image.tsx` (new) - K07 hub OG
  image. Shows the REAL uncontested (simple) vs. contested (complex)
  nationwide medians side by side, via `getCostByComplexity()` - matching
  the page's own uncontested/contested framing exactly.
- New `tests/k09-discover-hygiene.test.ts` (24 tests): robots-directive
  source audit (layout default, buildMeta merge behavior, the T09 noindex
  override, the embed noindex override, and confirmation that hand-rolled
  metadata objects declare no shadowing robots field) + OG-image source
  audit for all three new routes (1200x630 size, edge runtime, next/og
  import, real-data source calls, teal brand token, no forbidden
  purple/blue-gradient/pure-black tokens per `design/forbidden.md`).
- Updated `tests/seo-meta.test.ts`'s pre-existing "applies the robots
  override" test to assert the new merged shape (was a breaking assertion
  change caused intentionally by this wave's `buildMeta()` behavior change -
  not a bug fix to a failing test, a spec-required behavior change) and
  added a new test confirming an explicit caller-supplied
  `max-image-preview` still overrides the K09 default.

### K10 - AdProvider `journey` option (dormant)
Added `"journey"` as a fifth member of the `AdProvider` union
(`"adsense" | "ezoic" | "raptive" | "journey" | "none"`) in
`src/lib/monetization.ts`:
- `parseAdProvider()` now recognizes `"journey"` (falls back to `"adsense"`
  for any other unrecognized value, same as before).
- New `journeySiteId: string | null` field on `MonetizationConfig`, read
  from `NEXT_PUBLIC_JOURNEY_SITE_ID` (null when unset, same pattern as
  `raptiveSiteId`/`ezoicScriptSrc`).
- `src/components/monetization/AdProvider.tsx` - new `JourneySlot`
  component, copied structurally from the existing `EzoicSlot`/`RaptiveSlot`
  pattern (same `IntersectionObserver` lazy-load gate, same
  `min-h-[90px] sm:min-h-[250px]` CLS-safe reservation, same idempotent
  `injectScript()` helper - no new script-injection code path, reuses the
  existing one). Renders nothing when `NEXT_PUBLIC_JOURNEY_SITE_ID` is
  unset. Wired into `AdProvider`'s provider switch alongside the existing
  ezoic/raptive branches - the switch structure itself already guarantees
  the single-provider invariant (exactly one `if (provider === ...)` branch
  can match, since `parseAdProvider()` returns exactly one value from a
  mutually exclusive union), so `journey` inherits that guarantee for free
  rather than needing new isolation logic.
- Documented `NEXT_PUBLIC_JOURNEY_SITE_ID` in `.env.example` with an
  explicit "DO NOT set until ~1,000 real sessions/month" eligibility note
  (부속M §6, verified 2026-01-15 threshold) and the same
  never-loads-alongside-another-provider invariant language as the other
  three network blocks. Updated the `NEXT_PUBLIC_AD_PROVIDER` valid-values
  comment to include `journey`.
- Extended `tests/monetization.test.ts` (existing file, +8 tests): journey
  recognized by `parseAdProvider`, `journeySiteId` null-when-unset and
  reads-when-set, `NEXT_PUBLIC_AD_PROVIDER=journey` config round-trip, and
  the single-provider-invariant `describe` block updated to check all five
  providers (was four) plus a new explicit "journey never coexists with
  another provider" assertion.
- No render-level test was added for `AdProvider.tsx` itself (matching the
  pre-existing pattern - Ezoic/Raptive are also only unit-tested at the
  `parseAdProvider`/config layer, never at the component-render layer; the
  closest existing component-level ad coverage is `tests/ad-proximity.test.ts`,
  which tests the AdSense/`AdUnit` path specifically and was left
  unchanged).

### K11 - AdSense Day-1 runbook
New `docs/adsense-day1.md` - faithfully transcribes 부속M §3 ("승인 후 첫
90일 설정 시퀀스") for this repo, following the exact structure/tone already
established in the sibling `firepath`/`SaaSCostX`/`DentalCostFinder`/
`LaunchCostCalc` repos' versions of this same doc from their own P1 waves
(read all four as reference before writing this one; DentalCostFinder's -
also YMYL - was the closest structural analog). Contents: the 2026 Auto ads
default-change context (vignette triggers 3/9, load-slider removal 4/16,
dynamic-anchor 6/19, ad-intents Gemini insertion 6/30 no-opt-out), the Day-1
settings audit (vignette additional-triggers off + YMYL full-OFF override,
ad intents off, anchor mobile-on/bottom-only + >1000px off, banner max-2 +
generous spacing, ad-exclusion-area registration referencing this repo's
own `docs/ad-exclusion-zones.md` selectors, side rails OK), Week-1 CLS
recheck (referencing this repo's real `WebVitalsReporter` `web_vitals` GA4
event), Month-1 Auto-only, Month-2-3 single manual slot gated on two clean
Policy Center weeks (referencing this repo's real `ResultMonetization`/
`AdProvider` below-result placement and `tests/ad-proximity.test.ts`),
Experiments-off-90-days, the IVT house rules (never render live ads
logged-in, never ask anyone to look at the site, never buy/exchange
traffic, don't react to "being assessed" serving limits), and the rollback
trigger (`calculator_complete` -10-15% => revert immediately, referencing
this repo's real GA4 instrumentation from 부속I T03/T13). All figures/event
names/file references are this repo's real ones (`ad-exclusion-zones.md`'s
actual selector, `WebVitalsReporter`, `calculator_complete`, the real
`ResultMonetization`/`CostResult` placement chain) - no invented specifics.
Pure documentation, no code path - not unit-tested, consistent with
`docs/ad-exclusion-zones.md` (K05) also being untested directly.

### Test delta
- 375 tests (K01 wave baseline) -> 408 tests. New file:
  `tests/k09-discover-hygiene.test.ts` (24). Extended:
  `tests/monetization.test.ts` (+8), `tests/seo-meta.test.ts` (+1 net: 1
  existing test's assertion updated for the new merge behavior, 1 new test
  added).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors (required narrowing `BuildMetaParams.robots`
  from `Metadata["robots"]` to `Exclude<Metadata["robots"], string | null>`
  to fix a "spread types may only be created from object types" error
  introduced by the K09 merge - the underlying `Metadata.robots` type
  permits a string-shorthand form that no real call site in this repo uses)
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated to this wave, carried over
  from prior waves' notes)
- `npm test`: 408/408 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (unchanged - K09/
  K10/K11 add zero new indexable pages; the three new OG image routes are
  image-generation endpoints, not pages), three new OG image routes
  confirmed in build output (`/[state]/opengraph-image`,
  `/category/-/opengraph-image` (bundle path for the dynamic
  `/category/[category]/opengraph-image`), `/divorce-cost-by-state/opengraph-image`),
  no new TypeScript errors, no new warnings beyond the pre-existing one.

### Not touched (guardrails)
No AdSense loader/script, `ads.txt` route logic, Auto-ads console state, or
any ad-push/init semantics were modified. `AdProvider`'s single-network
invariant is preserved and extended (not weakened) by adding a fifth
mutually-exclusive option. K01-K05 (editorial depth, page-depth audit,
crawler accessibility, SPA re-init audit, ad-proximity audit) and K08
(IndexNow) were not touched this wave. No commit/deploy performed
(orchestrator-owned).
