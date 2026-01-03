# タスク: [タスク名]

## 概要

[このタスクで何を実現するかを1-2文で説明]

## 背景

[なぜこのタスクが必要なのか、どのような問題を解決するのか]

## 要件

### 機能要件

- [ ] [要件1]
- [ ] [要件2]
- [ ] [要件3]

### 非機能要件

- [ ] パフォーマンス: [要件があれば]
- [ ] セキュリティ: [要件があれば]

## 設計

### 影響範囲

| パッケージ | ファイル          | 変更内容               |
| ---------- | ----------------- | ---------------------- |
| `shared`   | `domain/xxx/`     | 新規ドメインモデル追加 |
| `api`      | `features/xxx/`   | 新規Feature Slice追加  |
| `web`      | `components/xxx/` | UI追加                 |

### ドメインモデル

```typescript
// 型定義の概要
interface XXX {
  readonly id: XXXId;
  // ...
}
```

### API

| エンドポイント | メソッド | 認証 | 説明     |
| -------------- | -------- | ---- | -------- |
| `xxx.list`     | Query    | 不要 | 一覧取得 |
| `xxx.create`   | Mutation | 要   | 新規作成 |

## 実装手順

1. [ ] `shared/domain/xxx/` にドメインモデル作成
2. [ ] `shared/schemas/` にZodスキーマ追加
3. [ ] `api/features/xxx/` にFeature Slice作成
4. [ ] `api/trpc/router.ts` にルーター追加
5. [ ] `web/components/xxx/` にUI実装
6. [ ] README.md更新

## テスト計画

- [ ] ユニットテスト: [対象]
- [ ] 統合テスト: [対象]
- [ ] 手動テスト: [確認項目]

## 完了条件

- [ ] 全ての要件が実装されている
- [ ] `pnpm lint` がパス
- [ ] `pnpm typecheck` がパス
- [ ] README.mdが更新されている

## 参考

- [関連ドキュメント](../../docs/xxx.md)
- [関連Issue](#xxx)

---

**作成日:** YYYY-MM-DD
**担当:**
**ステータス:** Draft / Ready / In Progress / Completed

<!-- 完了したタスクは completed/ フォルダに移動 -->
