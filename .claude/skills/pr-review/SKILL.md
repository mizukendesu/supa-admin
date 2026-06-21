> **Generated file.** 編集する場合は `.ai-context/skills/pr-review/SKILL.md` を編集してください。
> 変更は `pnpm ai-context:generate` で反映されます。

# pr-review

PR 内容の説明と採点。**ユーザーが明示的に依頼したときのみ** 実行。

## 4 軸スコア（各 1–5）

1. **正しさ** — バグ、型、contract 整合
2. **安全性** — auth、RLS、secrets、暗号化
3. **保守性** — 読みやすさ、依存方向、重複
4. **テスト** — カバレッジ、重要パスの検証

## 出力形式

```markdown
## 例え話
（小学生向けの比喩で PR の目的を説明）

## スコア
| 軸 | 点 | 一言 |
|----|-----|------|
| 正しさ | X/5 | ... |
| 安全性 | X/5 | ... |
| 保守性 | X/5 | ... |
| テスト | X/5 | ... |

## 良い点
- ...

## 改善提案
- ...
```

## 情報取得

```bash
gh pr view <number> --json title,body,files,commits
gh pr diff <number>
```

## 観点

`.ai-context/rules/*.md` と `docs/` を踏まえる。

## 関連

- `smart-review`: finding 振り分け + 修正実行（別物）
