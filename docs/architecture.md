# Architecture — LegalCostCalc

## System Overview
```
[Browser] -> [Vercel Edge] -> [Next.js App Router]
                                    |
                              [API Routes]  (thin controllers)
                                    |
                              [Services]    (business logic)
                                    |
                              [Repositories] (data access)
                                    |
                              [Supabase PostgreSQL]
```

## Directory Structure
```
legalcostcalc/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with fonts, metadata, analytics
│   │   ├── page.tsx                      # Home page (hero + calculator + trust signals)
│   │   ├── globals.css                   # Tailwind + custom styles
│   │   ├── error.tsx                     # Root error boundary
│   │   ├── not-found.tsx                 # Smart 404 with popular page recommendations
│   │   ├── icon.tsx                      # Dynamic favicon (32x32)
│   │   ├── apple-icon.tsx                # Apple Touch icon (180x180)
│   │   ├── opengraph-image.tsx           # Home OG image (1200x630)
│   │   ├── manifest.ts                   # PWA manifest
│   │   ├── robots.ts                     # robots.txt
│   │   ├── sitemap.ts                    # XML sitemap (410+ URLs)
│   │   ├── about/
│   │   │   ├── page.tsx                  # About & Methodology (E-E-A-T)
│   │   │   └── opengraph-image.tsx
│   │   ├── [state]/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx              # SEO landing page (SSG, 408 pages)
│   │   │       ├── error.tsx             # SEO page error boundary
│   │   │       ├── loading.tsx           # Skeleton loading state
│   │   │       └── opengraph-image.tsx   # Dynamic OG image
│   │   ├── compare/
│   │   │   ├── page.tsx                  # Cross-state & cross-category comparison
│   │   │   ├── layout.tsx                # Compare metadata + WebPage schema
│   │   │   └── opengraph-image.tsx
│   │   └── api/
│   │       ├── costs/
│   │       │   ├── route.ts              # GET /api/costs
│   │       │   └── compare/
│   │       │       └── route.ts          # GET /api/costs/compare
│   │       ├── categories/
│   │       │   └── route.ts              # GET /api/categories
│   │       └── states/
│   │           └── route.ts              # GET /api/states
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives (card, button, select, etc.)
│   │   ├── calculator/
│   │   │   ├── cost-calculator.tsx        # Main calculator form
│   │   │   └── cost-result.tsx           # Results display with fees, rates, sources
│   │   ├── compare/
│   │   │   └── comparison-form.tsx       # Compare mode toggle + form controls
│   │   ├── layout/
│   │   │   ├── header.tsx                # Sticky header with mobile hamburger (Sheet)
│   │   │   └── footer.tsx                # Dark footer with disclaimer + links
│   │   ├── seo/
│   │   │   ├── faq-schema.tsx            # Schema.org FAQPage
│   │   │   ├── breadcrumb-schema.tsx     # BreadcrumbList schema
│   │   │   ├── organization-schema.tsx   # WebSite + Organization schema
│   │   │   ├── cost-details-section.tsx  # Common fees + cost factors section
│   │   │   └── related-links.tsx         # Internal cross-links (state/category)
│   │   └── shared/
│   │       ├── disclaimer.tsx            # Legal disclaimer banner
│   │       ├── cost-display.tsx          # Large cost range display (memoized)
│   │       ├── affiliate-cta.tsx         # Affiliate partner CTA section
│   │       └── error-content.tsx         # Shared error boundary content
│   ├── lib/
│   │   ├── hooks/
│   │   │   └── use-request-tracker.ts    # Race condition prevention for async requests
│   │   ├── services/
│   │   │   ├── cost-service.ts           # Cost calculation + page data logic
│   │   │   ├── category-service.ts       # Category operations
│   │   │   └── state-service.ts          # State operations
│   │   ├── repositories/
│   │   │   ├── cost-repository.ts        # Supabase cost queries
│   │   │   ├── category-repository.ts    # Supabase category queries
│   │   │   └── state-repository.ts       # Supabase state queries
│   │   ├── types/
│   │   │   ├── index.ts                  # Re-exports
│   │   │   ├── cost.ts                   # LegalCostData, CostRange, CostComparisonResult
│   │   │   ├── state.ts                  # StateInfo, USStateCode
│   │   │   ├── category.ts              # CategoryInfo, LegalCategorySlug
│   │   │   └── api.ts                    # ApiResponse<T> envelope
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   └── server.ts                 # Server client
│   │   ├── constants/
│   │   │   ├── disclaimer.ts             # Disclaimer text
│   │   │   ├── states.ts                 # 51 states (code, name, slug, population)
│   │   │   ├── categories.ts             # 8 category definitions
│   │   │   ├── costs.ts                  # Default state, complexity levels
│   │   │   └── affiliates.ts             # Affiliate partner URLs + categories
│   │   ├── utils/
│   │   │   ├── format.ts                 # Currency/number formatting
│   │   │   ├── seo.ts                    # SEO helper functions
│   │   │   ├── sanitize.ts              # Input sanitization
│   │   │   └── api-security.ts           # Rate limiting, IP extraction
│   │   └── utils.ts                      # cn() Tailwind class merge
│   └── data/
│       └── seed/
│           └── costs.json                # 1,224 seed records (51 states x 8 cats x 3 complexity)
├── scripts/
│   └── generate-icons.mjs               # PWA icon generation
├── public/
│   ├── icon-192.svg                      # PWA icon 192px
│   ├── icon-512.svg                      # PWA icon 512px
│   └── favicon.svg                       # SVG favicon
├── docs/
│   ├── architecture.md                   # This file
│   ├── prd-analysis.md                   # P0/P1/P2 feature breakdown
│   └── PROGRESS.md                       # Development session log
└── Configuration
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.ts
    ├── .env.local                         # Supabase keys (gitignored)
    ├── PRD.md                             # Product requirements
    ├── DESIGN.md                          # Design system specification
    ├── REVIEW.md                          # Code review log
    ├── RESEARCH.md                        # Technical research log
    ├── CLAUDE.md                          # Project rules for AI
    └── feature_list.json                  # Feature acceptance tracking
```

## Database Schema

### states
| Column | Type | Notes |
|--------|------|-------|
| code | CHAR(2) PK | 'CA', 'TX', etc. |
| name | VARCHAR(50) | 'California' |
| slug | VARCHAR(50) | 'california' |
| population | INTEGER | Census data |
| median_household_income | INTEGER | BLS data |

### categories
| Column | Type | Notes |
|--------|------|-------|
| slug | VARCHAR(50) PK | 'divorce', 'dui' |
| display_name | VARCHAR(100) | 'Divorce' |
| description | TEXT | Category description |
| seo_title_template | VARCHAR(200) | '{category} Cost in {state} {year}' |
| seo_description_template | TEXT | Meta description template |
| sort_order | INTEGER | Display ordering |

### legal_costs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| category | VARCHAR(50) FK | -> categories.slug |
| state_code | CHAR(2) FK | -> states.code |
| complexity | VARCHAR(20) | 'simple'/'moderate'/'complex' |
| cost_low | INTEGER | USD |
| cost_median | INTEGER | USD |
| cost_high | INTEGER | USD |
| hourly_rate_low | INTEGER | USD/hr |
| hourly_rate_median | INTEGER | USD/hr |
| hourly_rate_high | INTEGER | USD/hr |
| typical_duration | VARCHAR(50) | '3-6 months' |
| common_fees | JSONB | ["filing fee $300", ...] |
| sources | JSONB | ["url1", "url2"] |
| last_verified_at | TIMESTAMP | Data freshness |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last modification |
| UNIQUE(category, state_code, complexity) |

### RLS Policies
- `legal_costs`: Public SELECT for all rows
- `states`: Public SELECT
- `categories`: Public SELECT
- Admin operations via service role key (server-side only)

## API Design

### Response Envelope
```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: { count?: number; cached?: boolean };
}
```

### Endpoints
| Endpoint | Service Method | Repository Method |
|----------|---------------|-------------------|
| GET /api/costs | costService.getCosts() | costRepo.findByFilters() |
| GET /api/costs/compare | costService.compareCosts() | costRepo.findByStates() |
| GET /api/categories | categoryService.getAll() | categoryRepo.findAll() |
| GET /api/states | stateService.getAll() | stateRepo.findAll() |

### Security
- Rate limiting: 100 requests/min/IP (shared utility in api-security.ts)
- Input validation: validateFilterParam() sanitizes query params
- CSP + HSTS + X-Frame-Options headers (next.config.ts)
- Sanitized error messages (no stack traces in production)

## Static Generation Strategy
- `generateStaticParams()` produces 408 paths (51 states x 8 categories)
- ISR revalidation: 604800 seconds (7 days)
- Schema.org structured data: FAQPage, BreadcrumbList, Organization, WebSite
- OG images: dynamically generated per page via ImageResponse (edge runtime)

## Key Patterns
- **useRequestTracker hook**: Prevents stale async responses from overwriting newer results
- **ComparisonResultSection**: Shared rendering for cross-state and cross-category comparisons
- **Memoized CostDisplay**: React.memo for large cost range rendering performance
- **Affiliate constants**: Centralized partner data in affiliates.ts for easy URL management
