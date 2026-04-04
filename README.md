# LegalCostCalc

> How much will your legal matter REALLY cost?

Free legal cost calculator for all 50 US states + DC. Estimates costs for divorce, DUI, personal injury, bankruptcy, real estate, estate planning, criminal defense, and immigration.

**Live**: [legalcostcalc.vercel.app](https://legalcostcalc.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Hosting | Vercel |

## Features

- **Cost Calculator**: Select legal category + state + complexity for instant cost estimates with source citations
- **416 SEO Pages**: Programmatic landing pages for every state/category combination with Schema.org FAQPage
- **State Comparison**: Side-by-side cost comparison between any two states
- **Legal Disclaimer**: UPL-compliant disclaimers on every page (top + bottom)
- **Accessibility**: WCAG 2.1 AA target, keyboard navigation, focus-visible rings, aria-labels

## Architecture

```
[Browser] -> [Next.js App Router]
                    |
              [API Routes]     <- validation only
                    |
              [Services]       <- business logic
                    |
              [Repositories]   <- data access
                    |
              [Supabase PostgreSQL + RLS]
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and keys

# Run development server
npm run dev

# Build for production (generates 416 static pages)
npm run build
```

## Data

- **1,224 cost data points** (51 jurisdictions x 8 categories x 3 complexity levels)
- All data includes source URLs for transparency
- State-adjusted costs (CA/NY/MA 20-40% higher, MS/WV/AR 15-25% lower)
- Quarterly data refresh cycle planned

## URL Structure

- `/` — Home page with calculator
- `/[state]/[category]-cost` — SEO landing page (e.g., `/california/divorce-cost`)
- `/compare` — State comparison tool
- `/api/costs?category=X&state=XX&complexity=Y` — Cost lookup API
- `/api/costs/compare?states=CA,TX&category=divorce` — Comparison API

## Legal

This tool provides general cost estimates for informational purposes only. It is NOT legal advice. Costs vary significantly based on individual circumstances. Consult a licensed attorney in your jurisdiction for specific guidance.

## License

MIT
