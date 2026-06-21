<!-- AUTO-GENERATED from .ai-context/ — do not edit -->

# SupaAdmin — Claude Code

Repository rules and workflows for Claude Code. Edit `.ai-context/` and run `pnpm ai-context:generate`.

## Architecture

Source: [.ai-context/rules/architecture.md](.ai-context/rules/architecture.md)

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

---

## Coding Standards

Source: [.ai-context/rules/coding-standards.md](.ai-context/rules/coding-standards.md)

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

---

## Testing

Source: [.ai-context/rules/testing.md](.ai-context/rules/testing.md)

# Testing

- Unit tests: pure functions without a database (crypto, RLS SQL, permissions)
- DB tests: Meta Supabase on port **54322**; wrap Drizzle tests in `withRollbackTx`
- oRPC handler tests: use `adminCallContext`, `callWithInput` / `callWithoutInput` from `apps/web/lib/orpc/__tests__/helpers.ts`
- Supabase mocks: `mockSupabaseQuery` from `@supa-admin/vitest-config/supabase-mock`
- Run: `pnpm test` (starts Meta if needed), `pnpm test:turbo`, `pnpm test:coverage`
- Coverage target: 80% (see `codecov.yml`)

## Test file layout

| Area | Location |
|------|----------|
| Shared packages | `packages/shared/<pkg>/__tests__/**/*.test.ts` |
| oRPC handlers | `apps/web/lib/orpc/__tests__/**/*.test.ts` |
| Critical UI | `apps/web/components/**/__tests__/**/*.test.tsx` (`@vitest-environment jsdom`) |
| Middleware | `apps/web/middleware.test.ts` |

## Environment defaults

Applied in `tooling/vitest/setup.ts` when unset: `TEST_DATABASE_URL`, Supabase keys, `ENCRYPTION_KEY`, `SETUP_SECRET`, `SKIP_ENV_VALIDATION=true`.

Human-readable details: [docs/testing.md](../../docs/testing.md)

---

## Agent Testing

Source: [.ai-context/workflows/agent-testing.md](.ai-context/workflows/agent-testing.md)

# Agent Testing Guide

How to write and run tests in this repo when acting as an AI agent.

## Quick run

```bash
pnpm db:start:meta
pnpm test:turbo
# or with coverage:
pnpm test:coverage
```

`pnpm test` wraps `test-with-supabase.ts` and starts Meta if needed.

## Database tests (Drizzle)

Import from `@supa-admin/vitest-config/setup`:

```typescript
import { withRollbackTx } from "@supa-admin/vitest-config/setup";

await withRollbackTx(async (tx) => {
  // test body — always rolls back
});
```

Requires Meta Postgres on **54322**. Defaults are set in `tooling/vitest/setup.ts`.

## oRPC handler tests

Use helpers from `apps/web/lib/orpc/__tests__/helpers.ts`:

```typescript
import { adminCallContext, callWithInput, callWithoutInput, TEST_IDS } from "./helpers";

const ctx = adminCallContext();
await callWithInput(procedure, { ...input }, { context: ctx });
await callWithoutInput(procedure, { context: ctx });
```

Mock Supabase with `mockSupabaseQuery` from `@supa-admin/vitest-config/supabase-mock`.

## UI tests

Critical forms use `@vitest-environment jsdom` in `apps/web/components/**/__tests__/`.

## What not to test

Coverage excludes thin barrels, shadcn `components/ui/**`, page wrappers, and test support code. Focus on auth, connections, handlers, and permission logic.

See [docs/testing.md](../../docs/testing.md) for exclusions and CI env vars.

---

## Local Dev

Source: [.ai-context/workflows/local-dev.md](.ai-context/workflows/local-dev.md)

# Local Development

## Prerequisites

Docker Desktop, Supabase CLI, Node 22.18+, pnpm 9.15+

## Bootstrap

```bash
corepack enable
pnpm install
pnpm db:start          # Meta (5432x) + Target (5442x)
pnpm setup:local       # env + reset + seed local Target connection
pnpm dev               # http://127.0.0.1:3000
```

## Port map

| Stack | Studio | API | DB |
|-------|--------|-----|-----|
| Meta (`supabase/`) | http://127.0.0.1:54323 | 54321 | 54322 |
| Target (`supabase-target/`) | http://127.0.0.1:54423 | 54421 | 54422 |

## Two-stage authentication

1. **Meta login** — Supabase Auth on the Meta project (platform users).
2. **Target session** — per-connection browser Supabase client for end-user auth on Target projects.

## Environment

Copy `.env.example` → `apps/web/.env.local` or run `pnpm setup:env-local` after `pnpm db:start`.

Key variables: `NEXT_PUBLIC_META_SUPABASE_URL`, `META_SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `DATABASE_URL`.

## Common commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm db:start:meta` | Meta Supabase only |
| `pnpm db:reset` | Reset Meta DB |
| `pnpm db:reset:target` | Reset Target DB |
| `pnpm lint` / `pnpm typecheck` | Pre-PR checks |

---

## Pr Checklist

Source: [.ai-context/workflows/pr-checklist.md](.ai-context/workflows/pr-checklist.md)

# Pull Request Checklist

## Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test:turbo   # requires Meta Supabase on port 54322
```

Optional: `pnpm test:coverage` locally before touching test-sensitive code.

## Commit messages

Conventional Commits (enforced by lefthook):

```
feat: add connection health check
fix: handle RLS sync timeout
docs: update quick start
```

## Database migrations

- Edit Drizzle schema in `packages/shared/db`.
- Do **not** commit hand-written files under `supabase/migrations/` — lefthook blocks this.
- CI generates migrations via the `migrate-db` workflow.

## AI context changes

If you edit `.ai-context/**`:

```bash
pnpm ai-context:generate
```

Commit both SSOT changes and generated files (`.cursor/`, `AGENTS.md`, `CLAUDE.md`, etc.).

## PR content

- One logical change per PR when possible.
- Fill out the PR template checklist.
- Ensure CI passes (lint, typecheck, build, test with coverage, ai-context-check when applicable).

---

## Project skills

Skills live in `.ai-context/skills/` and are copied to agent-specific directories.
Run `pnpm ai-context:generate` after editing.

External recommendations: [.ai-context/extras/recommended-skills.md](.ai-context/extras/recommended-skills.md)
