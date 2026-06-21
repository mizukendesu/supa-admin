---
name: smart-review
description: >-
  レビュー finding を「自動修正 / ユーザー確認 / 無視」に振り分け、
  自動修正できるものだけ worktree で修正 PR を出す。
---

# smart-review

コードレビュー finding の triage と修正実行。

## 振り分け（A / B / C）

| バケット | 基準 | 対応 |
|---------|------|------|
| **A 自動修正** | 明確な bug、typo、lint、テスト不足（局所） | worktree で修正 → PR |
| **B 無視** | 好み、スコープ外、誤検知 | 理由を記録 |
| **C ユーザー確認** | 設計判断、破壊的変更、仕様不明 | grill-me で深堀り |

## レビュー観点

1. セキュリティ（RLS、暗号化、権限）
2. 正しさ（oRPC contract ↔ handler 整合）
3. テスト（`withRollbackTx` / handler mock）
4. 仕様乖離（`docs/` / `.ai-context/rules/`）
5. パフォーマンス（`boost-performance` 参照）

## 修正 PR

- **必ず worktree**（`parallel-subagents`）
- `create-pr` スキルで PR 作成
- 親 worktree を直接編集しない

## 関連

- `pr-review`: 採点 + 平易説明（別スキル）
- `grill-me`: C バケットで併用
