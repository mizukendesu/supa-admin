# AI Agents Guide

How to use AI coding tools with SupaAdmin.

## Single source of truth

Agent-facing rules, workflows, and project skills live in [`.ai-context/`](../.ai-context/README.md).

**Do not edit generated files directly:**

| Generated | Purpose |
|-----------|---------|
| `AGENTS.md` | Codex / generic agents |
| `CLAUDE.md` | Claude Code |
| `.cursor/rules/**`, `.cursor/skills/**` | Cursor |
| `.claude/skills/**` | Claude Code skills |
| `.agents/skills/**` | Codex / agents skills |

## Edit workflow

1. Change `.ai-context/rules/*.md`, `.ai-context/workflows/*.md`, or `.ai-context/skills/<name>/SKILL.md`.
2. Run:

```bash
pnpm ai-context:generate
```

3. Commit SSOT and generated outputs together.

Lefthook re-runs generation on pre-commit when `.ai-context/**` is staged. CI [ai-context-check](../.github/workflows/ai-context-check.yml) fails if outputs are stale.

## Human docs vs agent rules

| Location | Audience | Content |
|----------|----------|---------|
| `.ai-context/rules/` | Agents | Concise rules with frontmatter |
| `docs/` | Humans & OSS | Detailed architecture, testing, CI |
| `.ai-context/workflows/` | Agents | Runbooks (local dev, PR, testing) |

Keep them aligned when changing conventions — use the `update-doc` skill or manual review.

## Project skills

Bundled skills (grill-me, create-pr, git-operations, etc.) are defined under `.ai-context/skills/` and copied to all agent directories on generate.

## External skills (skills.sh)

Recommended third-party skills are listed in [`.ai-context/extras/recommended-skills.md`](../.ai-context/extras/recommended-skills.md). Install locally:

```bash
npx skills add supabase/agent-skills --skill supabase
```

See [skills.sh](https://www.skills.sh/) for the full catalog.

## MCP (optional)

Copy [`.cursor/mcp.json.example`](../.cursor/mcp.json.example) to `.cursor/mcp.json` and fill in tokens. **Never commit secrets.**

Useful MCP servers for this project:

- **Supabase** — schema inspection, local project management
- **Vercel** — deployment and env vars (if hosted on Vercel)

## Testing as an agent

See [.ai-context/workflows/agent-testing.md](../.ai-context/workflows/agent-testing.md) and [testing.md](testing.md).

Quick check before a PR:

```bash
pnpm lint && pnpm typecheck && pnpm test:turbo
```
