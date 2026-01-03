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

### 5. 動作検証（必須 - 例外なし）

実装した機能が実際に動作することを検証する。「実装しました」だけでは完了にならない。

#### 5-1. Playwright MCP でブラウザ確認

1. `mcp__playwright__browser_navigate` でアプリを開く
2. 実装した機能を実際に操作する（ボタンクリック、フォーム入力など）
3. `mcp__playwright__browser_snapshot` で状態を確認
4. `mcp__playwright__browser_take_screenshot` でスクリーンショットを撮影
5. 問題があれば修正し、再度確認

#### 5-2. E2Eテストコードの作成・実行

実装した機能に対するE2Eテストを `apps/web/e2e/` に作成する。

```bash
pnpm --filter @ai-trpg/web e2e
```

**テスト作成ルール:**

- `goto("/")` から開始し、実際のユーザー操作をシミュレート
- モック実装は禁止 - 実際のUI操作で動作を確認
- スクリーンショットと動画が `apps/web/e2e-results/` に自動保存される

**禁止事項（これらはテスト失敗と同等に扱う）:**

- `goto()` で直接ページ遷移する紙芝居的テスト
- ハードコードされた認証コード・テストデータ
- DBに保存されたように見せかけて実際は保存されていない実装
- 外部サービス呼び出しをモックして実際には実行しない実装

### 6. ドキュメント更新

- 変更したモジュールのREADME.mdを更新
- 新しい関数・型の説明を追加
- 使用例があれば記載

---

## 出力

実装完了後、以下を報告:

1. **変更ファイル一覧**
2. **lint/typecheck結果**（Pass/Fail）
3. **E2Eテスト結果**（Pass/Fail）
4. **スクリーンショット**（Playwright MCPで撮影したもの）
5. **動画パス**（`apps/web/e2e-results/` 内）
