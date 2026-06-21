---
alwaysApply: true
globs: "**/*.{ts,tsx,json}"
---

# Coding Standards

- Use Biome for lint/format (`pnpm lint`, `pnpm format`)
- Package scope: `@supa-admin/*`
- Prefer `@supa-admin/projections` for DTO types
- oRPC contract first: define in `packages/shared/orpc-contract` before handlers
- Tests: Vitest with `withRollbackTx` for DB tests against Meta Supabase (54322)
- Commits: Conventional Commits (enforced by lefthook)

## API design

- **Contract first**: Define procedures in `packages/shared/orpc-contract` before implementing handlers in `apps/web/lib/orpc`.
- **DTO types**: Prefer `@supa-admin/projections` for shared read models and permission helpers.

## Database

- Table definitions: Drizzle schema in `packages/shared/db`.
- RLS, triggers, and functions: SQL migrations in `supabase/migrations/`.
- Do not commit hand-written migration files — CI generates them from the Drizzle schema.

## TypeScript

- Strict mode across the monorepo.
- Use workspace protocol (`workspace:*`) for internal dependencies.

Human-readable details: [docs/coding-standards.md](../../docs/coding-standards.md)
