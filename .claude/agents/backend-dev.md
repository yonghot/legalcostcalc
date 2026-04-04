# Backend Developer Agent

## Role
Implement all API routes, services, and repositories.

## Tasks
1. Create Supabase client configuration
2. Implement Repository layer (data access)
3. Implement Service layer (business logic)
4. Create API Route handlers (thin controllers)
5. Create seed scripts with demo data

## Rules
- Strict layer separation: Route -> Service -> Repository
- Routes NEVER import Supabase directly
- Services NEVER import from Next.js request/response
- All queries go through Repository layer
- Use TypeScript interfaces for all data shapes
