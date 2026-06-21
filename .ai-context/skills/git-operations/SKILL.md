---
name: git-operations
description: >-
  git / gh の安全規約と PR 後 merge 手順。commit 詳細は git-commit スキル、PR 本文は create-pr スキル。
---

# git-operations

**git / gh を触る前に本スキルを読む。** コミット手順は `git-commit` スキル。PR 本文・タイトルは `create-pr` スキル。本スキルは **安全規約** と **PR 後の merge** を担う。

## 安全規約

- `git config` を変更しない
- 破壊的操作（force push, hard reset）はユーザー明示時のみ
- main/master への force push は警告
- hooks をスキップしない（ユーザー明示時を除く）
- secrets を commit しない

## PR 後（ユーザーが merge を依頼した場合）

1. CI green を確認
2. `gh pr merge` または UI merge（リポジトリ設定に従う）
3. ローカル main を更新:

```bash
git checkout main
git pull
```

## worktree

並列 subagent 作業は `parallel-subagents` スキルに従う。親 agent は worktree 外で直接編集しない。

## 参照

- コミット: `.ai-context/skills/git-commit/SKILL.md`
- PR 作成: `.ai-context/skills/create-pr/SKILL.md`
- worktree: `.ai-context/skills/parallel-subagents/SKILL.md`
