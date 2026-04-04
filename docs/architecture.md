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
│   │   ├── layout.tsx                    # Root layout with fonts, metadata
│   │   ├── page.tsx                      # Home page (hero + calculator)
│   │   ├── globals.css                   # Tailwind + custom styles
│   │   ├── [state]/
│   │   │   └── [category]-cost/
│   │   │       └── page.tsx              # SEO landing page (SSG)
│   │   ├── compare/
│   │   │   └── page.tsx                  # Comparison page
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
│   │   ├── ui/                           # shadcn/ui primitives
│   │   ├── calculator/
│   │   │   ├── cost-calculator.tsx        # Main calculator form
│   │   │   ├── cost-result.tsx           # Results display
│   │   │   ├── cost-breakdown.tsx        # Fee breakdown
│   │   │   └── cost-chart.tsx            # Comparison bar chart
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   ├── seo/
│   │   │   ├── faq-schema.tsx            # Schema.org FAQPage
│   │   │   └── page-meta.tsx             # Dynamic meta tags
│   │   └── shared/
│   │       ├── disclaimer.tsx            # Legal disclaimer banner
│   │       ├── cost-display.tsx          # Large cost range display
│   │       └── state-selector.tsx        # State dropdown
│   ├── lib/
│   │   ├── services/
│   │   │   ├── cost-service.ts           # Cost calculation logic
│   │   │   ├── category-service.ts       # Category operations
│   │   │   └── state-service.ts          # State operations
│   │   ├── repositories/
│   │   │   ├── cost-repository.ts        # Supabase cost queries
│   │   │   ├── category-repository.ts    # Supabase category queries
│   │   │   └── state-repository.ts       # Supabase state queries
│   │   ├── types/
│   │   │   ├── cost.ts                   # LegalCostData, CostRange
│   │   │   ├── state.ts                  # USState, StateInfo
│   │   │   ├── category.ts              # LegalCategory, CategoryInfo
│   │   │   └── api.ts                    # ApiResponse envelope
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   └── server.ts                 # Server client
│   │   ├── constants/
│   │   │   ├── disclaimer.ts             # Disclaimer text
│   │   │   ├── states.ts                 # State data (code, name, slug)
│   │   │   └── categories.ts             # Category definitions
│   │   └── utils/
│   │       ├── format.ts                 # Currency/number formatting
│   │       ├── seo.ts                    # SEO helper functions
│   │       └── cn.ts                     # Tailwind class merge utility
│   └── data/
│       └── seed/
│           ├── states.json               # 51 state records
│           ├── categories.json           # 8 category records
│           └── costs.json                # Legal cost data
├── scripts/
│   └── seed.ts                           # Database seed script
├── public/
│   ├── manifest.json                     # PWA manifest
│   └── icons/                            # App icons
├── docs/                                 # Project documentation
├── .claude/                              # Claude Code configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local                            # Supabase keys (gitignored)
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

## Static Generation Strategy
- `generateStaticParams()` produces 400 paths (51 states x 8 categories with slug format)
- ISR revalidation: 604800 seconds (7 days)
- Fallback: 'blocking' for any missing combinations
