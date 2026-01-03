# @ai-trpg/api

Hono + Cloudflare Workers で構築されたバックエンドAPI。

## ディレクトリ構成

```
src/
├── features/              # Vertical Slice（機能単位）
│   ├── character/         # キャラクター機能
│   └── dungeon/           # ダンジョン機能
├── infrastructure/        # インフラ層（DB、外部サービス）
├── trpc/                  # tRPC設定
└── index.ts               # エントリーポイント
```

## アーキテクチャ

### Vertical Slice Architecture

機能単位でコードを凝集させる。レイヤー横断ではなく、機能縦断でファイルを配置。

```
features/{domain}/
├── router.ts      # API層: エンドポイント定義
├── useCases/      # Application層: ビジネスロジック
├── repository.ts  # Infrastructure層: データアクセス
└── mapper.ts      # 変換層: DB ⇔ ドメイン
```

### 依存の方向

```
Router → UseCase → Repository → Database
                ↓
            Domain Model (shared)
```

- UseCaseはRepositoryインターフェースに依存
- 具体的なDB実装は外から注入
- ドメインモデルは `@ai-trpg/shared` から参照

## コマンド

```bash
pnpm dev        # 開発サーバー起動
pnpm typecheck  # 型チェック
pnpm lint       # lint
pnpm build      # ビルド
pnpm deploy     # デプロイ
```

## API設計

### tRPCルーター命名規則

| パターン                       | 認証 | 用途             |
| ------------------------------ | ---- | ---------------- |
| `get` / `list`                 | 不要 | 公開データ取得   |
| `getMine` / `listMine`         | 必須 | 自分のデータ取得 |
| `create` / `update` / `delete` | 必須 | データ変更       |

### 認証

- `publicProcedure`: 認証不要
- `protectedProcedure`: 認証必須（Supabase Auth JWT検証）

### エラーハンドリング

- UseCase内で `Result` 型を使用
- Router内で `TRPCError` に変換

## 環境変数

`.dev.vars` を作成（`.dev.vars.example` を参照）。

## Feature追加手順

1. `features/{name}/` ディレクトリ作成
2. `router.ts` でtRPCルーター定義
3. `useCases/` にユースケース実装
4. `repository.ts` でデータアクセス実装
5. `mapper.ts` で変換ロジック実装
6. `trpc/router.ts` にルーター追加
