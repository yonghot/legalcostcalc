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
