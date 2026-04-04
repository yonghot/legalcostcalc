# PRD: LegalCostCalc

> **Grade**: S | **CPC**: $8-$60 | **Competition**: Low | **Est. Dev**: 7-10 days
> v3.0 Fact-checked | Last updated: 2026.04

## 1. Product Overview
PWA calculator showing estimated legal cost ranges by US state (50 + DC), legal category, and complexity level.

## 2. Target Users
1. US adults facing legal issues (divorce, DUI, personal injury, bankruptcy, etc.)
2. Users researching legal costs before hiring an attorney
3. Legal content creators needing data citations

## 3. Business Model (Hybrid)
| Revenue | Detail | Share |
|---------|--------|-------|
| Ads | AdSense -> Ezoic -> Mediavine (RPM $15-$50+) | 40-50% |
| Affiliate | LegalZoom, Avvo, Rocket Lawyer | 20-30% |
| Premium | $9.99/mo: PDF reports, attorney comparison, alerts | 20-30% |

## 4. Core Features (MVP)

### F1 — Cost Calculator (P0)
User flow: Select category -> Select state -> Select complexity -> Show results
- 8 legal categories: Divorce, DUI/DWI, Personal Injury, Bankruptcy, Real Estate, Estate Planning, Criminal Defense, Immigration
- Results: cost range (low-median-high), hourly rates, typical duration, common fees, sources

### F2 — Programmatic SEO Landing Pages (P0)
- URL: `/[state]/[category]-cost` (400 pages = 50 states x 8 categories)
- Each page: state+category cost data + interactive calculator + internal links
- Schema.org FAQPage structured data

### F3 — Cost Comparison (P1)
- Side-by-side comparison of 2 states
- Same-state cross-category comparison

### F4 — Disclaimer System (P0)
- Top + bottom of every page
- "Informational purposes only, NOT legal advice"
- No advice-type features ever

## 5. Tech Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 14+ (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Language | TypeScript |
| DB | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Analytics | Plausible or GA4 |

## 6. Database Schema
- `legal_costs` — category, state_code, complexity, cost ranges, hourly rates, sources
- `states` — code, name, slug, population, median income
- `categories` — slug, display_name, description, SEO templates
- RLS: public read on legal_costs

## 7. Data Strategy
- Sources: Martindale-Hubbell, Avvo, NOLO, state court websites, BLS, USCourts.gov
- All data requires source URL attribution
- 2+ independent source cross-validation preferred
- Quarterly data refresh cycle

## 8. SEO Strategy
- 400 programmatic landing pages
- Title pattern: `[Category] Cost in [State] [Year] — LegalCostCalc`
- Monthly blog content: 4-8 articles
- Internal linking: same category across states, same state across categories

## 9. Success Metrics
| Metric | M1 | M3 | M6 |
|--------|-----|-----|-----|
| Indexed pages | 100+ | 400+ | 600+ |
| Monthly organic traffic | 1K | 10K | 50K |
| Monthly revenue | $5-10 | $100-200 | $1K-2K |

## 10. Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| UPL legal risk | Medium | Full disclaimer, no advice features |
| Data accuracy | High | 2-source cross-validation, date stamps |
| YMYL E-E-A-T | Medium | Source transparency, "info tool" positioning |

## 11. Priority Matrix
- **P0 (MVP)**: F1 Calculator, F2 SEO Pages, F4 Disclaimer
- **P1 (Post-MVP)**: F3 Comparison
- **P2 (Future)**: Premium subscription, PDF reports
