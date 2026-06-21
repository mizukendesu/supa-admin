> **Generated file.** 編集する場合は `.ai-context/skills/update-doc/SKILL.md` を編集してください。
> 変更は `pnpm ai-context:generate` で反映されます。

# update-doc

実装変更後にドキュメントを最新化する。

## どこを編集するか

| 対象 | 編集先 |
|------|--------|
| エージェント rules | `.ai-context/rules/*.md` → `pnpm ai-context:generate` |
| 人間向け docs | `docs/*.md`, `README.md`, `CONTRIBUTING.md` |
| generated（禁止） | `AGENTS.md`, `CLAUDE.md`, `.cursor/**`, `.claude/**`, `.agents/**` |

**generated doc を直接編集しない。** SSOT を直して generate する。

## 手順

1. 実装 diff を読む
2. 影響する doc を特定
3. 最小差分で更新（過剰な書き換え禁止）
4. rules 変更時は `pnpm ai-context:generate`
5. 乖離がなければ「更新不要」と報告

## 参照

- `.ai-context/rules/`（agent canonical）
- `docs/architecture.md`, `docs/coding-standards.md`, `docs/testing.md`
