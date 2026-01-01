# タスク: フロントエンド基盤構築

## 概要

フロントエンド（apps/web）にtRPCクライアント、ルーティング、基本レイアウトを構築し、既存のバックエンドAPIと接続可能な状態にする。

## 背景

- バックエンドAPI（Character, Dungeon CRUD）は実装済みだが、フロントエンドが空の状態
- ユーザーがゲームを体験するためのUIが必要
- MVP（Phase 1）の「キャラクター作成」「ダンジョン選択」を実装するための基盤

## 要件

### 機能要件

- [ ] tRPCクライアントでバックエンドAPIに接続できる
- [ ] ページ間のルーティングが機能する
- [ ] 共通レイアウト（ヘッダー、メインコンテンツ）が表示される
- [ ] 以下のページスケルトンが存在する
  - [ ] ホーム（/）
  - [ ] キャラクター一覧（/characters）
  - [ ] ダンジョン一覧（/dungeons）
- [ ] APIからデータを取得して表示できる（動作確認用）

### 非機能要件

- [ ] 既存のshadcn/ui + Tailwind CSS構成を活用
- [ ] ダークモードベースのデザイン（灰暦の世界観に合わせる）
- [ ] 型安全性: tRPCによるエンドツーエンドの型推論

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
|-----------|----------|----------|
| `web` | `src/lib/trpc.ts` | tRPCクライアント設定 |
| `web` | `src/routes/` | ルート定義 |
| `web` | `src/components/layout/` | レイアウトコンポーネント |
| `web` | `src/pages/` | ページコンポーネント |
| `web` | `src/App.tsx` | ルーター統合 |
| `web` | `src/main.tsx` | プロバイダー設定 |
| `web` | `package.json` | 依存関係追加 |
| `api` | `src/index.ts` | CORS設定（必要に応じて） |

### 技術選定

| カテゴリ | 選定 | 理由 |
|---------|------|------|
| ルーティング | TanStack Router | 型安全、ファイルベースルーティング、React 19対応 |
| データフェッチ | TanStack Query + tRPC | 既存のtRPCルーターと統合、キャッシュ管理 |
| 状態管理 | Zustand（既存） | シンプル、React 19対応済み |

### ディレクトリ構成

```
apps/web/src/
├── lib/
│   ├── trpc.ts          # tRPCクライアント設定
│   └── utils.ts         # 既存
├── components/
│   ├── ui/              # shadcn/ui コンポーネント（既存）
│   └── layout/
│       ├── Header.tsx
│       ├── MainLayout.tsx
│       └── index.ts
├── pages/
│   ├── HomePage.tsx
│   ├── CharactersPage.tsx
│   ├── DungeonsPage.tsx
│   └── index.ts
├── routes/
│   ├── __root.tsx       # TanStack Router ルートレイアウト
│   ├── index.tsx        # /
│   ├── characters.tsx   # /characters
│   └── dungeons.tsx     # /dungeons
├── App.tsx              # RouterProvider
├── main.tsx             # QueryClientProvider, trpc.Provider
└── routeTree.gen.ts     # 自動生成
```

### API接続

```typescript
// apps/web/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@ai-trpg/api/trpc";

export const trpc = createTRPCReact<AppRouter>();
```

## 実装手順

1. [ ] 依存関係のインストール
   - `@trpc/client`, `@trpc/react-query`
   - `@tanstack/react-query`
   - `@tanstack/react-router`, `@tanstack/router-plugin`

2. [ ] tRPCクライアント設定
   - `src/lib/trpc.ts` 作成
   - httpBatchLink設定（開発環境: localhost:8787）

3. [ ] TanStack Router設定
   - `vite.config.ts` にプラグイン追加
   - ルートファイル作成（`src/routes/`）
   - `routeTree.gen.ts` 自動生成設定

4. [ ] プロバイダー設定
   - `src/main.tsx` に QueryClientProvider, trpc.Provider 追加
   - `src/App.tsx` に RouterProvider 設定

5. [ ] レイアウトコンポーネント作成
   - `Header.tsx`: ロゴ、ナビゲーション
   - `MainLayout.tsx`: ヘッダー + メインコンテンツ

6. [ ] ページコンポーネント作成
   - `HomePage.tsx`: ウェルカムメッセージ
   - `CharactersPage.tsx`: キャラクター一覧（API接続）
   - `DungeonsPage.tsx`: ダンジョン一覧（API接続）

7. [ ] API型のエクスポート設定
   - `apps/api/package.json` に exports 追加（型エクスポート用）
   - または `packages/shared` 経由での型共有

8. [ ] CORS設定（API側）
   - 開発環境で `localhost:5173` からのアクセスを許可

9. [ ] 動作確認
   - `pnpm dev` で両方起動
   - ブラウザでAPI接続確認

10. [ ] `pnpm lint -- --fix` 実行
11. [ ] `pnpm typecheck` 実行

## テスト計画

- [ ] 手動テスト: ページ遷移確認
- [ ] 手動テスト: API接続確認（キャラクター/ダンジョン一覧取得）
- [ ] 型チェック: `pnpm typecheck` パス

## 完了条件

- [ ] 全ての要件が実装されている
- [ ] `pnpm lint` がパス（警告なし）
- [ ] `pnpm typecheck` がパス
- [ ] 開発サーバーで3ページが表示される
- [ ] APIからデータ取得が確認できる

## 参考

- [TanStack Router ドキュメント](https://tanstack.com/router)
- [tRPC React Query ドキュメント](https://trpc.io/docs/client/react)
- [既存API実装](../../apps/api/src/trpc/router.ts)
- [設計書](../../docs/design.md)

## 注意事項

- APIの型エクスポートは `@ai-trpg/api` から直接インポートするか、`packages/shared` を経由するかを実装時に判断
- 認証は後続タスクで実装（現時点では publicProcedure のみ使用）
- Zustandストアは必要になった時点で追加（この基盤タスクでは不要）

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Ready
