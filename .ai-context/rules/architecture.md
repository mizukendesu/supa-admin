---
alwaysApply: true
globs: "**/*.{ts,tsx}"
---

# SupaAdmin Architecture

- Turborepo + pnpm monorepo with `@supa-admin/*` scope
- Meta DB: Drizzle SSOT in `packages/shared/db`, RLS/triggers in SQL migrations
- API: oRPC only via `apps/web/app/api/rpc` — no REST routes
- Auth: Supabase Auth (Meta). Target uses browser client (two-stage login)
- Local dev: dual Supabase — Meta 5432x, Target 5442x (+100 offset)
- ES/CQRS: not used

## Layering

```
apps/web/app          → UI (oRPC client for meta DB operations)
apps/web/lib/orpc     → handlers (use cases, auth)
packages/features/*   → domain repositories (future)
packages/shared/*     → cross-cutting (crypto, rls, auth, schema)
```

## Dependencies

- features must not import each other
- shared packages must not import from apps or features
- server-only: crypto, auth/server, auth/permissions, schema, rls, supabase-target/admin

## Dual Supabase model

| Stack | Purpose | Local ports |
|-------|---------|-------------|
| Meta (`supabase/`) | Users, connections, RBAC, encrypted target credentials | Studio 54323, API 54321, DB 54322 |
| Target (`supabase-target/`) | Sample schema for local dev and RLS testing | Studio 54423, API 54421, DB 54422 |

Target projects are registered as connections in Meta. Service role keys are encrypted at rest using `ENCRYPTION_KEY`.

Human-readable details: [docs/architecture.md](../../docs/architecture.md)
