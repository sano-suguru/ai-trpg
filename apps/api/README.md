# @ai-trpg/api

Hono + Cloudflare Workers で構築されたバックエンドAPI。

## ディレクトリ構成

```
src/
├── features/              # Vertical Slice（機能単位）
│   └── character/         # キャラクター機能
│       ├── router.ts      # tRPCルーター定義
│       ├── repository.ts  # データアクセス層
│       ├── mapper.ts      # DB ⇔ ドメインモデル変換
│       ├── useCases/      # ユースケース
│       │   ├── createCharacter.ts
│       │   ├── getCharacter.ts
│       │   ├── listCharacters.ts
│       │   ├── updateCharacter.ts
│       │   └── deleteCharacter.ts
│       └── index.ts       # 機能のエクスポート
├── infrastructure/        # インフラ層
│   └── database/          # DBクライアント、スキーマ
│       ├── client.ts      # Drizzle クライアント
│       └── schema/        # Drizzle スキーマ定義
├── trpc/                  # tRPC設定
│   ├── context.ts         # コンテキスト定義
│   ├── router.ts          # ルートルーター
│   └── index.ts           # tRPC初期化
└── index.ts               # エントリーポイント
```

## アーキテクチャ

### Vertical Slice Architecture

機能単位でコードを凝集させる。レイヤー横断ではなく、機能縦断でファイルを配置。

```
features/character/
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
# 開発サーバー起動
pnpm dev

# 型チェック
pnpm typecheck

# lint
pnpm lint

# ビルド
pnpm build

# デプロイ
pnpm deploy

# Cloudflare型生成
pnpm cf-typegen
```

## API設計

### tRPCルーター

```typescript
// features/character/router.ts
export const characterRouter = router({
  list: publicProcedure.query(...),      // 公開キャラ一覧
  get: publicProcedure.input(...).query(...),  // キャラ取得
  create: protectedProcedure.input(...).mutation(...),  // 作成
  update: protectedProcedure.input(...).mutation(...),  // 更新
  delete: protectedProcedure.input(...).mutation(...),  // 削除
});
```

### 認証

- `publicProcedure`: 認証不要
- `protectedProcedure`: 認証必須

### エラーハンドリング

```typescript
// UseCase内でResult型を使用
export const getCharacter = (
  id: CharacterId,
  repo: CharacterRepository
): ResultAsync<Character, AppError> => {
  return repo.findById(id)
    .andThen(fromNullable(() => Errors.notFound('Character', id)));
};

// Router内でHTTPレスポンスに変換
.query(async ({ input }) => {
  const result = await getCharacter(input.id, repo);
  return result.match({
    ok: (char) => char,
    err: (e) => { throw new TRPCError(toTRPCError(e)); }
  });
});
```

## 環境変数

```bash
# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# LLM（Phase 2以降）
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx
```

## Feature追加手順

1. `features/{name}/` ディレクトリ作成
2. `router.ts` でtRPCルーター定義
3. `useCases/` にユースケース実装
4. `repository.ts` でデータアクセス実装
5. `mapper.ts` で変換ロジック実装
6. `trpc/router.ts` にルーター追加
7. このREADME.mdを更新
