> **Generated file.** 編集する場合は `.ai-context/skills/extract-shared/SKILL.md` を編集してください。
> 変更は `pnpm ai-context:generate` で反映されます。

# extract-shared

重複コードの共通化。スコープを最小に保つ。

## 起動条件

- 同一パターンが **3 箇所以上** で重複
- ユーザーが refactor を依頼、または smart-review A バケット

## 配置ルール（architecture 準拠）

| 種類 | 置き場所 |
|------|----------|
| DTO / 読取モデル | `packages/shared/projections/` |
| UI 部品 | `packages/shared/ui/` |
| 認可・暗号・RLS | `packages/shared/auth`, `crypto`, `rls` |
| oRPC 手続き定義 | `packages/shared/orpc-contract/` |
| handler ロジック | `apps/web/lib/orpc/` |

- features 同士の import 禁止
- shared → apps の import 禁止

## 手順

1. 重複箇所を列挙
2. 共通化先を 1 つ決める（上表）
3. 抽出 → 呼び出し側を置換
4. テストを移動 / 追加
5. `pnpm lint && pnpm typecheck && pnpm test:turbo`

## 参照

- `.ai-context/rules/architecture.md`
- `.ai-context/rules/coding-standards.md`
