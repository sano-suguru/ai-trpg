# タスク: drizzle-kit v1.0.0-beta へのアップグレード

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Completed
**優先度:** Medium

## 背景

- Dependabot が esbuild の脆弱性（GHSA-67mh-4wv8-2f99）を検出
- drizzle-kit 0.31.8 は `@esbuild-kit/esm-loader` 経由で脆弱な esbuild@0.18.20 に依存
- drizzle-kit v1.0.0-beta で修正済み（`bug/fixed-in-beta` ラベル）
- 関連イシュー: [#3067](https://github.com/drizzle-team/drizzle-orm/issues/3067), [#5145](https://github.com/drizzle-team/drizzle-orm/issues/5145)

## 要件

### 機能要件

- [x] drizzle-kit を v1.0.0-beta.8 以降にアップグレード
- [x] esbuild 脆弱性の解消を確認

### 非機能要件

- [x] 既存のコードが動作すること
- [x] lint/typecheck がパスすること

## 影響範囲

| パッケージ | ファイル         | 変更内容                   |
| ---------- | ---------------- | -------------------------- |
| `api`      | `package.json`   | drizzle-kit バージョン更新 |
| root       | `pnpm-lock.yaml` | 依存関係更新               |

## Breaking Changes (v1.0.0-beta)

### 確認が必要な変更

1. **マイグレーションフォルダ v3**
   - journal.json が削除され、フォルダ構造が変更
   - `drizzle-kit up` で移行が必要
   - 現状: マイグレーションファイル未生成なので影響なし

2. **`.enableRLS()` の非推奨化**
   - 旧: `pgTable('name', {}).enableRLS()`
   - 新: `pgTable.withRLS('name', {})`
   - 現状: RLS は未使用なので影響なし

3. **schemaFilter の動作変更**
   - 全スキーマがデフォルトで管理対象に
   - 現状: public スキーマのみ使用なので影響なし

## 実装手順

1. [x] 現在のマイグレーション状態を確認
2. [x] drizzle-kit を beta にアップグレード
   ```bash
   pnpm --filter @ai-trpg/api add -D drizzle-kit@beta
   ```
3. [x] `pnpm install` で依存関係を更新
4. [x] esbuild@0.18.20 が削除されたことを確認
   ```bash
   pnpm ls esbuild --depth=10
   ```
5. [x] `pnpm lint` 実行
6. [x] `pnpm typecheck` 実行
7. [x] drizzle-kit コマンドの動作確認
   ```bash
   pnpm --filter @ai-trpg/api drizzle-kit generate --help
   ```

## ロールバック手順

問題が発生した場合:

```bash
pnpm --filter @ai-trpg/api add -D drizzle-kit@0.31.8
pnpm install
```

## 完了条件

- [x] drizzle-kit v1.0.0-beta.x がインストールされている
- [x] `pnpm ls esbuild` で脆弱なバージョンが含まれていない
- [x] `pnpm lint` がパス
- [x] `pnpm typecheck` がパス
- [ ] Dependabot アラートが解消

## 参考

- [drizzle-kit v1.0.0-beta.2 リリースノート](https://github.com/drizzle-team/drizzle-orm/releases/tag/v1.0.0-beta.2)
- [GitHub Issue #3067](https://github.com/drizzle-team/drizzle-orm/issues/3067)
- [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
