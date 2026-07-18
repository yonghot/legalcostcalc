# GA4 Measurement Interpretation Notes — LegalCostCalc

U-06 (부속U §4/§6, GA4 근본진단 개선스펙). Interpretation rules for reading
this site's GA4 data — **zero code change**, documentation only. Do not use
these notes to justify touching CMP/Consent Mode configuration; they exist
specifically so nobody "fixes" a measurement artifact by weakening consent
gating.

1. **Sessions-per-user < 1 is expected, not a bug.** It is the signature of
   Consent Mode cookieless pings from visitors who decline analytics consent
   (CMP fires anonymized/modeled pings that count toward users but never
   form a GA4 session). Do not change the CMP or Consent Mode implementation
   to "fix" this ratio — it is a correct reflection of consent-denied
   traffic, not a tracking defect.
2. **Datacenter-city traffic is bot traffic — exclude it from analysis.**
   Top cities that resolve to Google/AWS/cloud datacenters (e.g. Council
   Bluffs IA = Google, Ashburn VA / Boardman OR = AWS/cloud regions) are
   automated crawlers/bots, not real visitors. Treat sessions attributed to
   these cities as noise when reading engagement, funnel, or conversion
   numbers — do not use them to judge real user behavior.
3. **The funnel KPI is `calc_input_start` -> `calculator_complete` only.**
   Both events already exist in this repo's `EventName` union
   (`src/lib/analytics.ts`) and are fired exclusively on real user-driven
   interaction (see the T03 guard in `src/lib/utils/calc-funnel.ts` and its
   use in `src/components/calculator/cost-calculator.tsx`). Judge U-01's
   effect on the funnel using these two events specifically — not raw
   `page_view` counts, which are inflated by the bot/cookieless traffic
   described in points 1-2 above.
