> **Generated file.** 編集する場合は `.ai-context/skills/parallel-subagents/SKILL.md` を編集してください。
> 変更は `pnpm ai-context:generate` で反映されます。

# parallel-subagents

複数タスクを subagent で並列化するときの手順。

## 原則

- **親 agent**: worktree / branch 準備、タスク割当、結果統合のみ
- **subagent**: 割当 worktree 内で実装・テスト・PR 作成
- 親は subagent の worktree を直接編集しない

## 手順

1. ベース branch から worktree を作成:

```bash
git worktree add ../supa-admin-<task> -b feat/<task>
```

2. 各 subagent に worktree パス・branch・タスクを渡す
3. subagent 完了後、親が PR をレビュー / merge 判断
4. 不要 worktree を削除:

```bash
git worktree remove ../supa-admin-<task>
```

## PR

各 subagent は `create-pr` スキルで独立 PR を出す。衝突時は親が rebase 順序を調整。

## このプロジェクト

- DB テストは Meta 54322 が必要 — subagent に `pnpm db:start:meta` を明記
- マイグレーション手書き禁止 — Drizzle schema のみ編集
