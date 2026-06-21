# Recommended external skills (skills.sh)

Install with [skills.sh](https://www.skills.sh/). These are **not vendored** in the repo — run locally per developer.

## Supabase (core stack)

```bash
npx skills add supabase/agent-skills --skill supabase
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

## Next.js / React (apps/web)

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add vercel-labs/next-skills --skill next-best-practices
```

## Development workflow

```bash
npx skills add mattpocock/skills --skill tdd
npx skills add obra/superpowers --skill systematic-debugging
npx skills add obra/superpowers --skill verification-before-completion
```

## Project skills (in repo)

Project-specific skills live in `.ai-context/skills/` and are copied to `.cursor/`, `.claude/`, `.agents/` via `pnpm ai-context:generate`.

Do not duplicate external skills into `.ai-context/skills/` — link here instead.
