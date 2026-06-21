---
alwaysApply: false
globs: "**/__tests__/**"
---

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
