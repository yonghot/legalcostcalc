# API Layer Rules

## Architecture
- API Routes are thin controllers: validate input, call service, return response
- All business logic lives in `src/lib/services/`
- All database access lives in `src/lib/repositories/`
- API Routes NEVER import from `@supabase/supabase-js` directly

## Response Format
All API responses use the standard envelope:
```typescript
{ data: T | null, error: string | null, meta?: { count?: number } }
```

## Validation
- Validate query params at the route level
- Return 400 with descriptive error for invalid input
- Valid state codes: 2-letter uppercase (AL, AK, ... WY)
- Valid categories: lowercase slug from categories table
- Valid complexity: 'simple' | 'moderate' | 'complex'

## Error Handling
- 400: Invalid input (bad params, missing required fields)
- 404: Resource not found (invalid state/category combo)
- 500: Internal error (log details, return generic message)

## Endpoints
- `GET /api/costs` — Query costs by category, state, complexity
- `GET /api/costs/compare` — Compare costs across states
- `GET /api/categories` — List all legal categories
- `GET /api/states` — List all US states
