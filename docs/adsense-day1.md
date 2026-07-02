# AdSense Day-1 Runbook — LegalCostCalc

K11 (부속M §9 K11 / §3 / P05) — this document transcribes 부속M §3 ("승인 후
첫 90일 설정 시퀀스") for this repo. It is a **console runbook for the owner
to execute manually on approval day** — Claude Code does not (and must not)
touch the AdSense review queue, Auto ads state, or ad code behavior itself
(부속M §9 anti-patterns / guardrails). This file only documents what the
owner should click through, and when.

LegalCostCalc is a legal-cost YMYL site — apply the YMYL-specific rows below
in addition to the general Day-1 list.

---

## Context: 2026 Auto ads changes (why this list exists)

Google shipped three more-aggressive Auto ads defaults in 2026, all verified
as of this report:

1. Vignette (interstitial) **"additional triggers"** — a second trigger
   surfaced 2/9, and a third ("30-seconds-of-inactivity + interaction")
   auto-activated 3/9. (A back-button trigger that also shipped was removed
   6/15.) The 30-second-inactivity trigger is a real risk on this site
   because users pause mid-calculation (reviewing category/state/complexity
   selections before hitting Calculate) — a vignette firing there is a
   textbook accidental-click trap.
2. The in-page ad **load-frequency slider** was removed 4/16 and replaced by
   three banner "advanced settings" controls (max ads, spacing) — verify the
   auto-migrated values rather than assuming they match the old slider
   position.
3. **"Dynamic anchor ads"** auto-activated for desktop 6/19 (previously
   mobile-only).
4. **Ad intents** started auto-inserting Gemini-generated content into ad
   units 6/30, with **no opt-out toggle for the insertion itself** — the only
   control is turning the ad-intents format off entirely.

---

## Day-1 audit (run once per site, the day approval lands)

Location: **AdSense console → Ads → By site → [legalcostcalc.co] → Edit**

1. **Vignette (interstitial) ads — uncheck "additional triggers."** The
   30-second-inactivity trigger can fire while a visitor is mid-interaction
   with `CostCalculator` or `SettlementEstimatorForm` (reading a category
   description, comparing state options) — treat this as an accidental-click
   trap, not a legitimate placement.
   **YMYL override for this site: turn vignette ads fully OFF** (not just the
   additional triggers) for at least the first calendar month post-approval.
   This is a legal-cost YMYL surface — the extra caution is warranted even
   though 부속M's own YMYL categorization for legal/dental cost content puts
   the *Publisher Restrictions* risk at LOW (§8) — the real risk here is
   review friction and user trust, not category-restricted ad eligibility.
2. **Ad intents — turn OFF entirely**, site-wide. Gemini-generated ad-intent
   content has no per-page review step, and rendering unverified generated
   content next to legal cost information is not worth the risk at this
   traffic stage. There is no partial opt-out — the format itself must stay
   off.
3. **Anchor ads**:
   - Mobile: **ON**, **bottom-fixed only**. This is the highest-value
     always-on format for a tool-intent page at current traffic levels
     (부속M §7 lever #2).
   - **Turn OFF "anchor ads on screens wider than 1000px"** — this blocks the
     2026-06-19 desktop dynamic-anchor default from activating.
4. **In-page (banner) ads — advanced settings**:
   - Max ads per page: **2**.
   - Minimum spacing between ads: set to the **largest available value** the
     UI offers (generous spacing, not the default). This is the replacement
     control for the removed load-frequency slider — confirm the
     auto-migrated values actually match this before leaving the page.
5. **Ad exclusion areas** — register the calculator-widget region as an
   exclusion area so Auto ads placement cannot land inside the ~150px
   accidental-click buffer around the inputs/Calculate button. Use the
   selectors already documented in
   [`docs/ad-exclusion-zones.md`](./ad-exclusion-zones.md)
   (`[data-ad-exclusion-zone="calculator-widget"]`, present on both
   `CostCalculator` and `SettlementEstimatorForm`) — do not improvise new
   selectors in the console; that file is the source of truth and is kept in
   sync with the actual DOM structure.
6. **Side rails** — desktop: fine to leave ON. Lower policy risk than
   anchor/vignette/in-content formats, and this site's layout keeps the
   sidebar clear of the calculator inputs.

---

## Week 1 — CLS recheck

Re-measure Cumulative Layout Shift **after** Auto ads goes live. Post-approval
CLS regression is a documented common pattern (ad units injecting without a
reserved slot). This site's existing `WebVitalsReporter` `web_vitals` GA4
event (부속I T13, already wired) already captures CLS — use that data, don't
guess. Target: **CLS < 0.1**. If Auto ads pushes CLS above that, tighten the
banner spacing/max-ads settings from step 4 above before doing anything else.

## Month 1 — Auto-only

Run **Auto ads only** (the anchor + capped in-page banners from the Day-1
audit) for the full first month. No manual ad units, no experiments. Goal:
establish a clean policy-center history with zero flags before adding
anything else.

## Month 2–3 — one manual slot, after two clean weeks

Once the **Policy Center shows two consecutive clean weeks** (no policy
violations, no "limited ads" states), enable **exactly one** reserved manual
ad slot — the below-result placement this codebase already reserves for it
(`AdProvider` rendered inside `ResultMonetization`, which `CostResult` places
as the LAST block after the result card, `ResultShare`, `ResultDisclaimer`,
`RelatedMatters`, and `EmailMyResults` — see `docs/ad-exclusion-zones.md` and
`tests/ad-proximity.test.ts` for the structural guarantee). Do not add a
second manual slot in this window. If Policy Center shows any new warning
during those two weeks, the clock resets — wait for another two consecutive
clean weeks before retrying.

## Experiments — off for 90 days

Do not run AdSense Experiments for the first 90 days post-approval. At
current/expected traffic (real sessions currently in the single digits per
28 days), experiment results are not statistically meaningful — 부속M's own
guidance is to wait until traffic is around ~100 real sessions/day before an
experiment result means anything. Running one earlier just adds account-
history noise for zero signal.

---

## IVT house rules (account-fatal if violated — no exceptions)

- **Never** view/interact with live ads while logged into a Google account
  that has any relationship to this AdSense account (owner, family member,
  employee). Use an ad-blocking browser profile, or the AdSense Publisher
  Console's preview tools, for any visual QA of ad placement.
- **Never** ask friends, family, or colleagues to "check out the site" once
  ads are live — even one incidental click from someone who knows it's your
  site is enough to register as invalid traffic given this site's very low
  current traffic volume (real human traffic is currently ≈5–15/28 days —
  one self-referred click is a large percentage of total clicks).
- **Never** purchase, exchange, or otherwise artificially generate traffic or
  clicks, in any form, at any point.
- If the account enters a **"being assessed" / limited-ads serving state**:
  this is common for new accounts and typically auto-resolves within ~30
  days. **Do not react** — do not add ad units, do not file an appeal, do not
  try to "fix" it by changing traffic sources. Reacting is more likely to
  extend the review than to shorten it.

---

## Rollback trigger

AdSense stopped exposing session-level metrics in its own reporting as of
September 2025 — the monthly health check for this site is: **AdSense
format-level report + Policy Center status + GA4 `calculator_complete`
conversion rate** (already instrumented on this site, 부속I T03/T13).

**If any ad-configuration change (Day-1 audit, Month-2/3 manual slot, or any
later adjustment) is followed by a `calculator_complete` conversion rate drop
of 10–15% or more, revert that specific change immediately.** Do not wait for
a full reporting cycle to decide — a double-digit drop in the core conversion
event is the signal that an ad placement is interfering with tool usage (most
likely an accidental-click or layout-shift problem), and the fix is to undo
the most recent change, not to add more.

---

## Non-goals of this document

This runbook does not itself change any ad code, ad provider selection, or
Auto ads configuration — every step above is a manual action inside the
AdSense **console**, which Claude Code does not and must not automate (부속M
§9/§10 — owner-console actions are out of scope for code changes). The only
code-side guardrails this repo ships are: the exclusion-zone selectors
documented in `docs/ad-exclusion-zones.md` (K05), the pathname-only ad
re-init audit (K04, traced in `PROGRESS.md`'s P0 wave note and covered by
`tests/ad-proximity.test.ts`), and the single-programmatic-network invariant
in `src/lib/monetization.ts` / `src/components/monetization/AdProvider.tsx`
(K10, including the dormant `journey` option gated on
`NEXT_PUBLIC_JOURNEY_SITE_ID` for the future Journey-by-Mediavine upgrade).
