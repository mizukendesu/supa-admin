<!-- AUTO-GENERATED from .ai-context/ — do not edit -->

# SupaAdmin — Claude Code

Repository rules and workflows for Claude Code. Edit `.ai-context/` and run `pnpm ai-context:generate`.

## Architecture

Source: [.ai-context/rules/architecture.md](.ai-context/rules/architecture.md)

# SupaAdmin Architecture

- Turborepo + pnpm monorepo with `@supa-admin/*` scope
- Meta DB: Drizzle SSOT in `packages/shared/db`, RLS/triggers in SQL migrations
- API: oRPC via `apps/web/app/api/rpc` + CI Webhook via `apps/web/app/api/webhooks/*`
- Auth: Supabase Auth (Meta). Target uses browser client (two-stage login)
- Local dev: dual Supabase — Meta 5432x, Target 5442x (+100 offset)
- ES/CQRS: not used

## Layering

```
apps/web/app              → UI, RSC, thin HTTP adapters (oRPC + webhooks)
apps/web/lib/orpc         → oRPC handlers (thin — call workflows/features only)
apps/web/lib/server/loaders → cached RSC data via workflows
packages/workflows        → multi-domain orchestration
packages/features/*       → domain + application use cases (single aggregate)
packages/shared/repository-kit → Drizzle repository implementations
packages/shared/*         → cross-cutting (crypto, rls, auth, schema, ddd, errors)
```

## Architecture Constitution

Breaking these rules requires ADR + harness update:

1. Meta business data persistence uses **Drizzle repository-kit** (no Supabase `.from()` except Auth session)
2. Target data CRUD stays **browser → Target Supabase → RLS** (not oRPC)
3. RLS definition SSOT is **Meta**; apply via **Meta workflows only** (not outbound webhooks)
4. **No cross-import** between feature packages (orchestrate via workflows)
5. Presentation imports **workflow / feature index only** (no domain deep imports)
6. Inbound HTTP adapters are **thin** — business logic lives in one workflow/use-case
7. **oRPC contract first** — add procedures in `packages/shared/orpc-contract` before handlers

## Harness rules (CI enforced)

| ID | Tool | Rule |
|----|------|------|
| R1 | depcruise | presentation → infrastructure forbidden |
| R2 | depcruise | feature deep imports forbidden |
| R3 | depcruise | components → workflows/features forbidden |
| R4 | depcruise | feature cross-import forbidden |
| R5 | depcruise | workflow cross-import forbidden (internal/ only) |
| R6 | depcruise | domain → infrastructure forbidden |
| R7 | depcruise | shared → upper layers forbidden |
| R8 | architecture-check | app/** no direct Meta DB bypass |
| A1–A4 | architecture-check | grep patterns (see `scripts/architecture-check.ts`) |

Run: `pnpm lint:arch` + `pnpm architecture-check`

## Dependencies

- features must not import each other
- workflows → feature index + shared(server)
- shared packages must not import from apps or features (auth re-exports feature-access/setup)
- server-only: workflows, feature-*, repository-kit, crypto, auth/server, schema, rls

## Dual Supabase model

| Stack | Purpose | Local ports |
|-------|---------|-------------|
| Meta (`supabase/`) | Users, connections, RBAC, encrypted target credentials | Studio 54323, API 54321, DB 54322 |
| Target (`supabase-target/`) | Sample schema for local dev and RLS testing | Studio 54423, API 54421, DB 54422 |

Target projects are registered as connections in Meta. Service role keys are encrypted at rest using `ENCRYPTION_KEY`. Each connection has a per-connection webhook secret (`webhook_secret_enc`).

Human-readable details: [docs/architecture.md](../../docs/architecture.md)

---

## Coding Standards

Source: [.ai-context/rules/coding-standards.md](.ai-context/rules/coding-standards.md)

# Coding Standards

- Use Biome for lint/format (`pnpm lint`, `pnpm format`)
- Architecture harness: `pnpm lint:arch`, `pnpm architecture-check`
- Package scope: `@supa-admin/*`
- Prefer `@supa-admin/projections` for DTO types
- oRPC contract first: define in `packages/shared/orpc-contract` before handlers
- Handlers call `packages/workflows` or `packages/features/*` index only — no infrastructure imports
- Tests: Vitest with `withRollbackTx` for DB tests against Meta Supabase (54322)
- Commits: Conventional Commits (enforced by lefthook)

## API design

- **Contract first**: Define procedures in `packages/shared/orpc-contract` before implementing handlers in `apps/web/lib/orpc`.
- **Workflows**: Cross-domain orchestration in `packages/workflows`.
- **Features**: Single-domain use cases in `packages/features/*/application`.
- **DTO types**: Prefer `@supa-admin/projections` for shared read models and permission helpers.

## Database

- Table definitions: Drizzle schema in `packages/shared/db`.
- Persistence: `@supa-admin/repository-kit` (Supabase `.from()` only for Auth session).
- RLS, triggers, and functions: SQL migrations in `supabase/migrations/`.
- Do not commit hand-written migration files — CI generates them from the Drizzle schema.

## TypeScript

- Strict mode across the monorepo.
- Use workspace protocol (`workspace:*`) for internal dependencies.
- Feature packages: `exports` root only; `files` lists public entry paths.

Human-readable details: [docs/coding-standards.md](../../docs/coding-standards.md)

---

## Testing

Source: [.ai-context/rules/testing.md](.ai-context/rules/testing.md)

# Testing

- Unit tests: pure functions without a database (crypto, RLS SQL, permissions)
- DB tests: Meta Supabase on port **54322**; wrap Drizzle tests in `withRollbackTx`
- Repository integration: `packages/shared/repository-kit/__tests__/*integration*.test.ts`
- oRPC handler tests: use `adminCallContext`, `callWithInput` / `callWithoutInput` from `apps/web/lib/orpc/__tests__/helpers.ts`
- Architecture: `pnpm lint:arch`, `pnpm architecture-check`, `scripts/__tests__/architecture-check.test.ts`
- Supabase mocks: `mockSupabaseQuery` from `@supa-admin/vitest-config/supabase-mock`
- Run: `pnpm test`, `pnpm test:turbo`, `pnpm test:coverage`
- Coverage target: 80% (see `codecov.yml`)

## Test file layout

| Area | Location |
|------|----------|
| Shared packages | `packages/shared/<pkg>/__tests__/**/*.test.ts` |
| Features | `packages/features/<feature>/__tests__/**/*.test.ts` |
| Workflows | `packages/workflows/__tests__/**/*.test.ts` |
| oRPC handlers | `apps/web/lib/orpc/__tests__/**/*.test.ts` |
| Webhook routes | `apps/web/lib/webhooks/__tests__/**/*.test.ts` (covers `app/api/webhooks` handlers) |
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

Key variables: `NEXT_PUBLIC_META_SUPABASE_URL`, `META_SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `DATABASE_URL`, `ALLOW_LOCAL_TARGET_URLS` (local Target HTTP only).

## Common commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm db:start:meta` | Meta Supabase only |
| `pnpm db:reset` | Reset Meta DB (uses `npx supabase`) |
| `pnpm db:reset:target` | Reset Target DB |
| `pnpm verify:dod` | Webhook DoD scenarios 14–16 (dev server + seed required) |
| `pnpm lint` / `pnpm typecheck` | Pre-PR checks |

---

## Pr Checklist

Source: [.ai-context/workflows/pr-checklist.md](.ai-context/workflows/pr-checklist.md)

# Pull Request Checklist

## Before opening a PR

```bash
pnpm lint
pnpm lint:arch
pnpm architecture-check
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
- After schema changes locally: `pnpm db:push` against Meta (54322).

## AI context changes

If you edit `.ai-context/**`:

```bash
pnpm ai-context:generate
```

Commit both SSOT changes and generated files (`.cursor/`, `AGENTS.md`, `CLAUDE.md`, etc.).

## PR content

- One logical change per PR when possible.
- Fill out the PR template checklist.
- Ensure CI passes (lint, lint:arch, architecture-check, typecheck, build, test with coverage, ai-context-check when applicable).

Human-readable details: [docs/coding-standards.md](../../docs/coding-standards.md)

---

## Project skills

Skills live in `.ai-context/skills/` and are copied to agent-specific directories.
Run `pnpm ai-context:generate` after editing.

External recommendations: [.ai-context/extras/recommended-skills.md](.ai-context/extras/recommended-skills.md)
