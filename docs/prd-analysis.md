# PRD Analysis — LegalCostCalc

## Feature Priority Matrix

### P0 (MVP — Must Ship)

#### F1: Legal Cost Calculator (Core)
**What**: User selects legal category + state + complexity -> gets cost estimate
**Acceptance Criteria**:
- 8 legal categories: Divorce, DUI/DWI, Personal Injury, Bankruptcy, Real Estate, Estate Planning, Criminal Defense, Immigration
- 51 jurisdictions: 50 states + DC
- 3 complexity levels: simple, moderate, complex
- Result displays: cost range (low/median/high), hourly rates, typical duration, common fees, sources
- Disclaimer always visible above and below results

**Data Entities**: `legal_costs`, `states`, `categories`
**API**: `GET /api/costs?category=X&state=XX&complexity=Y`

#### F2: Programmatic SEO Landing Pages
**What**: 400 auto-generated pages (50 states x 8 categories) with unique SEO content
**Acceptance Criteria**:
- URL pattern: `/[state]/[category]-cost`
- Unique H1, title tag, meta description per page
- Schema.org FAQPage structured data
- Internal cross-linking (same category/other states + same state/other categories)
- Embedded interactive calculator
- ISR revalidation: 7 days

**Dependencies**: F1 calculator must work, seed data must exist

#### F4: Disclaimer System
**What**: Legal disclaimers on every page to mitigate UPL risk
**Acceptance Criteria**:
- Top banner + bottom section on every page
- Consistent text: "informational purposes only, NOT legal advice"
- No advice-type features ("Should I...", "Do I need...")
- No outcome prediction features

### P1 (Post-MVP)

#### F3: Cost Comparison
**What**: Side-by-side comparison of 2 states for same category
**Acceptance Criteria**:
- Select 2 states + 1 category
- Side-by-side cost display
- Visual difference indicators
**API**: `GET /api/costs/compare?states=CA,TX&category=divorce`

### P2 (Future)
- Premium subscription ($9.99/mo)
- PDF report download
- Attorney comparison tool
- Cost change alerts

## Data Model Requirements

### Core Tables
1. **legal_costs** — Primary data table. 408 rows at MVP (51 jurisdictions x 8 categories, but varying complexity = up to 1,224 rows for all combos)
2. **states** — 51 rows (50 states + DC). Metadata: name, slug, population, median income
3. **categories** — 8 rows. Metadata: display name, description, SEO templates, sort order

### Key Relationships
- `legal_costs.state_code` -> `states.code`
- `legal_costs.category` -> `categories.slug`
- Unique constraint: `(category, state_code, complexity)`

## API Endpoints

| Method | Path | Description | Priority |
|--------|------|-------------|----------|
| GET | /api/costs | Query costs by filters | P0 |
| GET | /api/costs/compare | Compare 2 states | P1 |
| GET | /api/categories | List categories | P0 |
| GET | /api/states | List states | P0 |

## Technical Risks
1. **Data volume**: 1,224 cost data points needed at MVP (51 x 8 x 3 complexity levels)
2. **SEO accuracy**: Programmatic pages must have genuinely unique, useful content
3. **Legal compliance**: UPL risk requires careful framing as "information only"
4. **Data freshness**: Quarterly updates needed; stale data erodes trust
