---
name: create-pr
description: >-
  現在のブランチから gh pr create で Pull Request を作成する。
  タイトルは Conventional Commits 形式、本文は Summary + Test plan。
---

# create-pr

PR 作成の単一入口。`gh` コマンドを使う。

## 事前確認（並列）

```bash
git status
git diff
git log --oneline -5
git diff main...HEAD   # またはベースブランチ
```

## タイトル

Conventional Commits 形式:

```
feat: add connection health check
fix: handle RLS sync timeout
chore: add AI context SSOT
```

## 本文テンプレート

```markdown
## Summary
- 変更の要点（1–3 bullets）

## Test plan
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm test:turbo
- [ ] 手動確認（該当時）
```

## 作成

```bash
git push -u origin HEAD
gh pr create --title "..." --body "$(cat <<'EOF'
## Summary
...

## Test plan
...
EOF
)"
```

## 注意

- ユーザーが明示的に依頼したときのみ commit / push する。
- secrets（`.env` 等）を含めない。
- PR URL を返す。
