# LegalCostCalc — Project Rules

## TOP RULES (read first, read last)
- Use LAYERED architecture: API Route -> Service -> Repository -> Supabase
- Components render UI only. Business logic lives in services.
- Every page shows the legal disclaimer. No exceptions.
- Never provide legal advice. Only cost ranges and general information.
- All cost data must have source attribution.

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Vercel
- **Package Manager**: npm

## Architecture
```
src/
  app/              # Next.js App Router pages
  components/       # React UI components (no business logic)
  lib/
    services/       # Business logic layer
    repositories/   # Data access layer (Supabase queries)
    types/          # TypeScript interfaces
    utils/          # Pure utility functions
    supabase/       # Supabase client configuration
  data/             # Static seed data (JSON)
```

## Naming Conventions
- Files: kebab-case (`legal-cost-service.ts`)
- Components: PascalCase (`CostCalculator.tsx`)
- Functions: camelCase (`getCostByState`)
- Database: snake_case (`legal_costs`, `state_code`)
- URLs: `/[state]/[category]-cost` (e.g., `/california/divorce-cost`)

## Data Rules
- All cost data requires `sources[]` with URLs
- Display `lastVerifiedAt` date on every cost result
- Data older than 1 year shows "data may be outdated" warning
- Single-source data labeled "estimated range"
- Two independent sources required for unlabeled data

## SEO Rules
- Title: `[Category] Cost in [State] [Year] — LegalCostCalc`
- H1: `How Much Does a [Category] Cost in [State]?`
- Each of 400 pages (50 states x 8 categories) is statically generated
- ISR revalidation: 7 days (604800 seconds)
- Schema.org FAQPage structured data on every landing page

## Legal Compliance (UPL Risk)
- ALWAYS show disclaimer: top and bottom of every page
- NEVER implement advice-type features ("Should I...", "Do I need...")
- NEVER predict outcomes or apply law to individual circumstances
- Present ONLY cost ranges and general information
- Disclaimer text is defined in `src/lib/constants/disclaimer.ts`

## API Design
- `GET /api/costs?category=X&state=XX&complexity=Y` — single cost lookup
- `GET /api/costs/compare?states=CA,TX&category=divorce` — comparison
- `GET /api/categories` — list all categories
- `GET /api/states` — list all states
- All responses use `{ data, error, meta }` envelope

## Testing
- Run `npm run build` to verify all pages generate
- Run `npm run lint` before commits
- Run `npm run typecheck` for type safety

## Commit Style
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance

## BOTTOM RULES (always remember)
- Layer violations are build-breaking bugs. Fix immediately.
- The disclaimer is not optional. It appears on every page.
- No legal advice. Ever. Only informational cost estimates.
- Every cost number needs a source.
