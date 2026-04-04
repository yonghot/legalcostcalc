# Component Layer Rules

## Architecture
- Components are PURELY presentational
- No direct API calls in components — use hooks or server components
- No Supabase imports in components
- Business logic belongs in `src/lib/services/`

## Component Organization
```
components/
  ui/               # shadcn/ui primitives (auto-generated)
  calculator/       # Cost calculator components
  layout/           # Header, Footer, Navigation
  seo/              # SEO-related components (Schema, Meta)
  shared/           # Shared across features (Disclaimer, CostDisplay)
```

## Naming
- One component per file
- File name matches component name in kebab-case
- Props interface: `[ComponentName]Props`

## Styling
- Use Tailwind CSS utility classes
- Follow DESIGN.md tokens for colors, spacing, typography
- Use `cn()` utility for conditional classes
- shadcn/ui components as base — extend, don't replace

## Accessibility
- All form inputs have associated labels
- Interactive elements have focus states
- Color is never the sole indicator of state
- Images have alt text, icons have aria-labels
