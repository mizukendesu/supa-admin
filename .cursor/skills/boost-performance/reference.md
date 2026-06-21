# Performance reference (SupaAdmin)

## Database

- Prefer indexed columns in RLS policies and connection lookups.
- Batch inserts in migrations/seeds; avoid per-row round trips in handlers.
- Use Drizzle `transaction` for multi-step Meta DB writes.

## oRPC / Next.js

- Keep handlers thin; heavy work belongs in shared packages with tests.
- Avoid fetching full connection lists when a single ID suffices.
- Server Components for data that does not need client interactivity.

## Target Supabase (browser)

- CRUD goes direct to Target — watch row limits and pagination on large tables.
- Do not decrypt service role keys on the client.

## When to escalate

- Query plans on Meta DB > 100ms in dev
- Handler doing sequential Supabase admin calls that could be parallel
- UI rendering > 1000 rows without virtualization

Follow-up items: open a GitHub issue with `perf` label.
