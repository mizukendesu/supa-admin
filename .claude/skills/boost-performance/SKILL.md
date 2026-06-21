> **Generated file.** 編集する場合は `.ai-context/skills/boost-performance/SKILL.md` を編集してください。
> 変更は `pnpm ai-context:generate` で反映されます。

# boost-performance

差分のパフォーマンス点検。実装完了前または subagent 完了報告時に実行。

## チェックリスト

- [ ] N+1 クエリ（Drizzle / Supabase loop）
- [ ] 不要な `select *` / 大きな JSON 列の全件取得
- [ ] Client Component での重い計算（memo / server 移譲）
- [ ] oRPC handler での逐次 await（並列化可能か）
- [ ] RLS ポリシーの per-row 関数コスト
- [ ] 未キャッシュの重複 fetch（React Query / RSC cache）
- [ ] バンドル: 巨大 lib の client import

## 報告

```markdown
boost-performance ✅
- 問題なし

# または

boost-performance ⚠️
- [重大] ...
- [軽微] ... → 同一 PR で修正 / follow-up PR
```

## 詳細

[reference.md](reference.md)
