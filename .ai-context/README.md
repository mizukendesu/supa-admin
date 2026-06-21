# AI Context (SSOT)

Single source of truth for agent-facing rules, workflows, and skills.

## Layout

```
.ai-context/
├── rules/          → Cursor rules (via generate)
├── workflows/      → runbooks included in AGENTS.md / CLAUDE.md
├── skills/         → project skills (Cursor / Claude / agents)
├── extras/         → recommended external skills (skills.sh)
└── scripts/        → generation pipeline
```

## Edit workflow

1. Edit `.ai-context/rules/*.md`, `.ai-context/workflows/*.md`, or `.ai-context/skills/<name>/SKILL.md`.
2. Run `pnpm ai-context:generate`.
3. Commit SSOT **and** generated outputs together.

## Generated outputs (do not edit directly)

- `CLAUDE.md` — Claude Code
- `AGENTS.md` — Codex / generic agents
- `.cursor/rules/**`, `.cursor/skills/**` — Cursor
- `.claude/skills/**` — Claude Code skills
- `.agents/skills/**` — Codex / agents skills

## Guardrails

1. **lefthook** `generate-ai-context`: re-generates when `.ai-context/**` is staged.
2. **CI** `.github/workflows/ai-context-check.yml`: fails if generated files are stale.

Human docs live in `docs/` — see [docs/ai-agents.md](../docs/ai-agents.md).
