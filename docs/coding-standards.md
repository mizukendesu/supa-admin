# Coding Standards

## Tooling

- **Lint / format**: Biome (`pnpm lint`, `pnpm format`)
- **Architecture**: `pnpm lint:arch` (dependency-cruiser R1–R7), `pnpm architecture-check` (A1–A4)
- **Package scope**: `@supa-admin/*`
- **Commits**: Conventional Commits (enforced by lefthook)

## Layering

```
apps/web/lib/orpc/handlers   → thin adapters (workflows / feature index only)
packages/workflows           → multi-domain orchestration
packages/features/*          → domain + application use cases
packages/shared/repository-kit → Drizzle repositories
```

See [docs/architecture.md](architecture.md) for the Architecture Constitution.

## API design

- **Contract first**: Define procedures in `packages/shared/orpc-contract` before handlers.
- **Single-domain ops**: Call `packages/features/*/application` from handlers.
- **Cross-domain ops**: Call `packages/workflows` from handlers or RSC loaders.
- **Outbound Webhook**: `apps/web/app/api/webhooks/*` — same workflows as admin UI, HMAC auth.
- **DTO types**: Prefer `@supa-admin/projections` for shared read models.

## Database

- Table definitions: Drizzle schema in `packages/shared/db`.
- Runtime persistence: `@supa-admin/repository-kit` (not Supabase `.from()` except Auth session).
- RLS, triggers, and functions: SQL migrations in `supabase/migrations/` (CI-generated).
- Do not commit hand-written migration files.

## TypeScript

- Strict mode across the monorepo.
- Use workspace protocol (`workspace:*`) for internal dependencies.
- Feature packages export **package root only** (`exports: { ".": "./src/index.ts" }`).
