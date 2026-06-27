# Brand Pack — LegalCostCalc

> Referenced by the deploy-loop richness gate (풍성도 ②) for empty-space thresholds.
> Chosen pack: **professional-restrained** (NOT modern-rich).

## Why professional-restrained
LegalCostCalc is a US legal **cost-information utility** under UPL (unauthorized
practice of law) risk. DESIGN.md §1 mandates "credibility over flair" and the
product's value is **accurate, sourced** cost data — not visual density. The
generic "modern-rich" pack (hero illustrations, stat banners, social-proof
walls, dense feature grids) would actively harm trust here and several of its
moves are explicitly forbidden by design/forbidden.md.

## Richness, redefined for this product
"Rich" here means **complete and trustworthy**, not visually dense:
- Every page answers its question with sourced ranges + visible disclaimer.
- Calculator/Compare flows have all three states (loading/empty/error) + 404/500.
- SEO landing pages carry unique H1, FAQ schema, internal links, cost breakdown.

## Thresholds (adapted)
| Metric | modern-rich default | professional-restrained (this project) |
|---|---|---|
| Empty-gray ratio ceiling | ≤ 35% | ≤ 45% (whitespace is a feature, not a gap) |
| Sorted/list view min items | ≥ 6 | ≥ 6 **only where a list genuinely exists** (states, categories, related links) — never via fabricated rows |
| Conventional sections required | hero+features+social-proof+use-cases+FAQ+CTA+footer | hero + clear value + FAQ + disclaimer + footer sitemap (social-proof/use-cases OPTIONAL; never fake) |

## Hard rule (overrides richness gate)
**Never** add fabricated cost data, fake sources, fake testimonials, or fake
usage stats to satisfy a richness metric. A richness "improvement" that touches
data integrity or the disclaimer is rejected and logged as integrity_risk.
(See [[design/forbidden.md]], CLAUDE.md Data Rules + UPL section.)
