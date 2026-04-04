# LegalCostCalc

Free legal cost calculator for all 50 US states + DC. Estimates costs for divorce, DUI, personal injury, bankruptcy, real estate, estate planning, criminal defense, and immigration.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Vercel

## Features

- **Cost Calculator**: Select category + state + complexity for instant cost estimates
- **400+ SEO Pages**: Programmatic pages for every state/category combination
- **State Comparison**: Side-by-side cost comparison between two states
- **Legal Disclaimer**: UPL-compliant disclaimers on every page

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL and keys

# Run development server
npm run dev

# Build for production
npm run build
```

## Architecture

```
API Route (validation) -> Service (business logic) -> Repository (data access) -> Supabase
```

## Data

- 1,224 cost data points (51 jurisdictions x 8 categories x 3 complexity levels)
- All data includes source URLs for transparency
- Quarterly data refresh cycle planned

## Legal

This tool provides general cost estimates for informational purposes only. It is NOT legal advice.
