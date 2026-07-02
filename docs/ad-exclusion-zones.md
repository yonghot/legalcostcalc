# Ad Exclusion Zones (K05)

Reference for the site owner to configure **Google AdSense Auto ads → Site →
Ad exclusion / page-level exclusion (CSS selector)** once the site is
approved. This is a console action (out of scope for Claude Code — see the
ad-revenue spec §10 P05 Day-1 checklist); this document only records the
selectors and the verification that backs them.

## Why this matters

The ad-revenue spec's policy traps (§7, §9 K05) require: **no ad container
within ~150px of the calculator's inputs / Calculate button.** Auto ads
placement is largely automatic, so the durable mitigation is a registered
**exclusion zone** around every calculator input surface, in addition to the
structural page order already enforced in code (ads only ever render inside
`ResultMonetization`, which is placed *after* the result card — see
`src/app/[state]/[slug]/page.tsx`'s T13 comments and
`tests/ad-proximity.test.ts`).

## Selectors to register

| Selector | What it covers | Where it renders |
|---|---|---|
| `[data-ad-exclusion-zone="calculator-widget"]` | The full inputs + "Calculate" button card (category/state/complexity selects, gross/pct/costs fields, the Calculate button itself, and the clickwrap consent gate) | `CostCalculator` (home page `/`, every `/[state]/[slug]` spoke page) and `SettlementEstimatorForm` (`/settlement-estimator`) |
| `.adsbygoogle` | The ad `<ins>` element itself — registering it is not an exclusion target, it's listed here so the owner can visually confirm in DevTools that it never appears inside a `[data-ad-exclusion-zone]` ancestor | Rendered only inside `ResultMonetization` → `DisplaySlot` → `AdProvider` → `AdUnit` |

`data-ad-exclusion-zone="calculator-widget"` is a plain DOM attribute added
in this wave (no visual/behavioral change) to:
- `src/components/calculator/cost-calculator.tsx` (the `Card` wrapping the
  category/state/complexity selects + Calculate button)
- `src/components/calculator/settlement-estimator-form.tsx` (the `Card`
  wrapping the gross/pct/costs fields + Estimate button — this page has no
  ad slot today, but the marker future-proofs it if one is ever added)

## Structural guarantee (already enforced in code, independent of the console setting)

1. **Single ad slot per page.** `AdProvider` (`src/components/monetization/AdProvider.tsx`)
   is the only programmatic-ad call site reachable from a real page route;
   it delegates to exactly one network at a time (`parseAdProvider`,
   tested in `tests/monetization.test.ts`).
2. **Below-result placement only.** The only page-level renderer of
   `ResultMonetization` is `CostResult` (`src/components/calculator/cost-result.tsx`),
   which places it via `<ResultMonetization ... />` as the LAST block, after
   the result Card, `ResultShare`, `ResultDisclaimer`, `RelatedMatters`, and
   `EmailMyResults`. Two prior in-content `<AdProvider>` call sites that
   used to render *above* the calculator/result (T13) were removed for
   exactly this reason — see the comments in
   `src/app/[state]/[slug]/page.tsx`.
3. **Real spacing, not just visual CSS.** `ResultMonetization`'s outer
   container is `mt-8 space-y-6`, and `DisplaySlot` reserves
   `min-h-[90px]` (mobile) / `min-h-[250px]` (`sm:` and up) — verified in
   `tests/ad-proximity.test.ts`, which asserts (a) the `adsbygoogle` marker
   never appears before "Estimated Total Cost" in `CostResult`'s rendered
   HTML, and (b) the `CostCalculator`/`SettlementEstimatorForm` button
   markup never contains an ad marker.
4. **Embed widget never serves ads.** `/embed/[state]/[slug]` passes
   `monetizationDisabled` through to `CostResult`, so the entire
   `ResultMonetization` stack (including the ad slot) renders nothing
   inside third-party iframes (`tests/embed-monetization.test.ts`).
5. **Settlement estimator carries no ad slot at all** — `SettlementEstimatorForm`
   has zero `AdUnit`/`AdProvider` call sites, so there is no proximity risk
   on `/settlement-estimator` today regardless of console configuration.

## Owner action (console, not code — P05 in the ad-revenue spec)

Once AdSense approves the site:
1. AdSense → Ads → By site → Edit → **Ad exclusions**.
2. Add a page-level CSS-selector exclusion for
   `[data-ad-exclusion-zone="calculator-widget"]` (Auto ads supports
   excluding specific page sections via CSS selector in the site editor).
3. Re-verify after the Day-1 Auto ads audit (§3 of the spec) that no
   Auto-placed unit lands inside the excluded zone — spot-check with an
   ad-blocker-free browser per the IVT house rules (§3: never click,
   Publisher Console preview only).
