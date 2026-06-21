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
