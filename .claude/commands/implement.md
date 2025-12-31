# 実装タスク

指定されたタスク仕様に基づいて実装を行う。

## 入力

$ARGUMENTS - タスク仕様ファイルのパス（例: `.claude/tasks/feature-xxx.md`）

---

## 実行手順

### 1. コンテキスト収集

**必須で読み込むファイル:**
- 指定されたタスク仕様ファイル
- 関連するモジュールのREADME.md（`apps/{app}/README.md`, `packages/{pkg}/README.md`）
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体のルール
- [docs/architecture.md](../../docs/architecture.md) - アーキテクチャ設計
- 関連するドメインの既存コード

**変更対象の確認:**
- 影響を受けるファイルをリストアップ
- 依存関係を確認（shared → api/web の依存方向を遵守）

### 2. 設計確認

**Vertical Slice Architecture に従う:**
- ドメインモデル → `packages/shared/src/domain/{entity}/`
- ドメインプリミティブ（ID型） → `packages/shared/src/domain/primitives/`
- Zodスキーマ → `packages/shared/src/schemas/`
- Feature Slice → `apps/api/src/features/{domain}/`
  - `router.ts` - tRPCルーター
  - `repository.ts` - データアクセス
  - `mapper.ts` - DB ⇔ ドメイン変換
  - `useCases/` - 各ユースケース

**FDM（Functional Domain Modeling）に従う:**
- Branded Types で型安全なID
- Smart Constructors が `Result<T, E>` を返す
- 全て `readonly` でイミュータブル

### 3. 実装

**エラーハンドリング:**
- `Result<T, E>` / `ResultAsync<T, E>` を使用
- `try-catch` は使わない
- `Errors.*` ファクトリで一貫したエラー生成

**コーディング規約:**
- import文に拡張子を書かない
- 深い相対パス禁止（`@/` エイリアス使用）
- `any` 禁止 → `unknown` + 型ガード

### 4. 品質チェック

```bash
pnpm lint
pnpm typecheck
```

- 全てのエラー**と警告**を修正する
- 警告を無視しない

### 5. ドキュメント更新

- 変更したモジュールのREADME.mdを更新
- 新しい関数・型の説明を追加
- 使用例があれば記載

---

## 出力

実装完了後、以下を報告:

1. **変更ファイル一覧**
2. **lint/typecheck結果**（Pass/Fail）
3. **次のステップ**（レビュー依頼、テスト実行など）
