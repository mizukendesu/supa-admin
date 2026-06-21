---
name: git-commit
description: >-
  Conventional Commits 形式で git commit を作成する。
  明示依頼時のみ実行。amend / force は厳格条件付き。
---

# git-commit

ユーザーが **明示的に commit を依頼したときのみ** 実行する。

## 事前（並列）

```bash
git status
git diff
git log --oneline -5
```

## メッセージ

Conventional Commits（lefthook で検証）:

```
feat(scope): short imperative summary

Optional body explaining why.
```

## 手順

1. secrets（`.env` 等）が staged にないか確認
2. 関連ファイルのみ `git add`
3. HEREDOC で commit:

```bash
git commit -m "$(cat <<'EOF'
feat: message here

EOF
)"
```

4. `git status` で成功確認

## 禁止・制限

- `git config` を変更しない
- `--no-verify` / `--no-gpg-sign` はユーザー明示時のみ
- `push --force` to main/master は警告
- **amend** は全条件を満たすときのみ: ユーザー明示、直前 commit が自分、未 push
- hook 失敗時は amend せず **新規 commit** で修正

## push

ユーザーが明示的に依頼したときのみ push する。
