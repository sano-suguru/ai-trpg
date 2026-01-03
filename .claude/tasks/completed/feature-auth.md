# タスク: 認証基盤構築

## 概要

Supabase Authを使用した認証基盤を構築し、ユーザーが自分のキャラクターを作成・管理できるようにする。

## 背景

- 現在のAPIは全て `publicProcedure` で、認証なしで動作
- 「自分のキャラクター」を管理するには、ユーザー識別が必須
- MVPの核心機能（キャラ作成、セッション生成）は全て認証が前提
- tRPCの `protectedProcedure` は定義済みだが、実際の認証チェックが未実装

## 要件

### 機能要件

- [ ] ユーザーがMagic Link（メール）でログインできる
- [ ] ユーザーがログアウトできる
- [ ] 認証状態がUI上で確認できる（ヘッダーにユーザー表示）
- [ ] `protectedProcedure` が実際に認証チェックを行う
- [ ] 未認証ユーザーが保護エンドポイントにアクセスすると401エラー

### 非機能要件

- [ ] JWTトークンはSupabase標準の仕組みを使用
- [ ] トークンはHTTPOnlyクッキーまたはlocalStorageで管理（Supabaseデフォルト）
- [ ] セッション自動更新（Supabase Auth標準機能）

## 設計

### 影響範囲

| パッケージ | ファイル                           | 変更内容                   |
| ---------- | ---------------------------------- | -------------------------- |
| `shared`   | `domain/primitives/ids.ts`         | UserId型（既存）           |
| `api`      | `src/index.ts`                     | Supabaseクライアント初期化 |
| `api`      | `src/trpc/context.ts`              | JWT検証、ユーザー取得      |
| `api`      | `src/infrastructure/supabase/`     | Supabaseクライアント       |
| `api`      | `wrangler.jsonc`                   | 環境変数追加               |
| `web`      | `src/lib/supabase.ts`              | Supabaseクライアント       |
| `web`      | `src/lib/auth.ts`                  | 認証ユーティリティ         |
| `web`      | `src/components/layout/Header.tsx` | ログイン/ログアウトボタン  |
| `web`      | `src/routes/login.tsx`             | ログインページ             |
| `web`      | `src/main.tsx`                     | Supabaseプロバイダー設定   |

### 認証フロー

```
[ログイン]
1. ユーザーがメールアドレスを入力
2. Supabase Auth がMagic Linkをメール送信
3. ユーザーがリンクをクリック
4. Supabaseがセッション発行、ブラウザにトークン保存
5. 以降のAPIリクエストにAuthorization headerを付与

[APIリクエスト]
1. フロントエンドがAuthorization: Bearer <token> を付与
2. Honoミドルウェアがトークンを検証
3. 検証成功 → ctx.user にユーザー情報をセット
4. tRPC protectedProcedure が ctx.user を確認

[ログアウト]
1. Supabase signOut() 呼び出し
2. ローカルのトークン削除
3. UI更新
```

### API

| エンドポイント    | メソッド | 認証 | 説明                 |
| ----------------- | -------- | ---- | -------------------- |
| `auth.getSession` | Query    | 不要 | 現在のセッション取得 |
| `auth.signOut`    | Mutation | 要   | ログアウト           |

Note: ログイン自体はSupabase Auth UIまたはクライアントSDKで処理

### 環境変数

```bash
# API側（wrangler.jsonc の vars または secrets）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...  # JWT検証用（secretsに）

# Web側（.env.local）
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

## 実装手順

### Phase 1: API側の認証基盤

1. [ ] Supabaseクライアント設定
   - `api/src/infrastructure/supabase/client.ts` 作成
   - 環境変数から接続情報を取得

2. [ ] JWT検証ミドルウェア
   - `api/src/middleware/auth.ts` 作成
   - Authorization headerからトークン取得
   - Supabase `getUser()` でユーザー検証
   - Honoコンテキストにユーザー情報をセット

3. [ ] tRPCコンテキスト更新
   - `api/src/trpc/context.ts` 修正
   - Honoコンテキストからユーザー情報を取得
   - `ctx.user` にセット

4. [ ] authルーター作成（任意）
   - `api/src/features/auth/router.ts`
   - `getSession` プロシージャ

5. [ ] 環境変数設定
   - `wrangler.jsonc` に変数追加
   - `.dev.vars.example` 作成

### Phase 2: フロントエンド認証UI

6. [ ] Supabaseクライアント設定
   - `web/src/lib/supabase.ts` 作成
   - `@supabase/supabase-js` インストール

7. [ ] 認証フック作成
   - `web/src/hooks/useAuth.ts`
   - `useSession`, `useUser`, `signIn`, `signOut`

8. [ ] ログインページ作成
   - `web/src/routes/login.tsx`
   - メールアドレス入力フォーム
   - Magic Link送信ボタン
   - 送信完了メッセージ

9. [ ] ヘッダー更新
   - `web/src/components/layout/Header.tsx`
   - ログイン状態表示
   - ログイン/ログアウトボタン

10. [ ] tRPCクライアント更新
    - リクエストにAuthorization headerを付与
    - `web/src/lib/trpc.ts` 修正

### Phase 3: 統合・テスト

11. [ ] 動作確認
    - ログインフロー全体をテスト
    - 保護エンドポイントへのアクセス確認

12. [ ] `pnpm lint -- --fix` 実行

13. [ ] `pnpm typecheck` 実行

## テスト計画

### 手動テスト

- [ ] Magic Linkでログインできる
- [ ] ログイン後、ヘッダーにユーザー情報が表示される
- [ ] ログアウトできる
- [ ] 未認証で保護エンドポイントにアクセスすると401
- [ ] 認証済みで保護エンドポイントにアクセスできる

### E2Eテスト（将来）

- Playwright + Supabase test helperでログインフローをテスト

## 完了条件

- [ ] 全ての要件が実装されている
- [ ] `pnpm lint` がパス（警告なし）
- [ ] `pnpm typecheck` がパス
- [ ] ログイン→保護エンドポイントアクセス→ログアウトの一連のフローが動作する
- [ ] README.mdが更新されている

## 既存コード参照

### tRPCコンテキスト（現状）

`apps/api/src/trpc/context.ts`:

```typescript
// AuthUser インターフェースは定義済み
export interface AuthUser {
  readonly id: UserId;
}

// createContext で user: null を返している（TODO: 認証実装）
export function createContext(_opts: unknown, c: HonoContext): TRPCContext {
  // TODO: 認証情報をHonoコンテキストから取得
  return {
    honoContext: c,
    user: null, // ← ここを実装する
  };
}

// 型ガードも定義済み
export function isAuthenticated(
  ctx: TRPCContext,
): ctx is AuthenticatedTRPCContext {
  return ctx.user !== null;
}
```

### protectedProcedure（現状）

`apps/api/src/trpc/index.ts`:

```typescript
// 実装済みだが、ctx.user が常に null のため機能していない
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "認証が必要です",
    });
  }

  return opts.next({
    ctx: { ...ctx, user: ctx.user },
  });
});
```

### Honoエントリーポイント

`apps/api/src/index.ts`:

```typescript
// CORS設定は既にあり、Authorization ヘッダーを追加する必要あり
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"], // ← Authorization を追加
  }),
);

// 環境変数の型定義を拡張
interface Env {
  DATABASE_URL: string;
  // SUPABASE_URL, SUPABASE_ANON_KEY 等を追加
}
```

### エラーハンドリングパターン

`packages/shared/src/lib/result.ts`:

```typescript
// 外部API呼び出しは wrapExternalCall() でラップ
const result = await wrapExternalCall(supabase.auth.getUser(token), "Supabase");

// Result<T, E> を返し、エラーは Errors.* ファクトリで生成
if (result.isErr()) {
  return err(Errors.unauthorized("トークンが無効です"));
}
```

### 既存エラー型

`packages/shared/src/types/errors.ts`:

```typescript
// 認証関連エラーは既に定義済み
export interface UnauthorizedError extends BaseError {
  readonly code: "UNAUTHORIZED";
}

export interface SessionExpiredError extends BaseError {
  readonly code: "SESSION_EXPIRED";
}

// ファクトリ関数
Errors.unauthorized("認証が必要です");
Errors.sessionExpired("セッションが期限切れです");
```

## 参考

- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Supabase + Cloudflare Workers](https://supabase.com/docs/guides/functions/frameworks/hono)
- [既存のtRPCコンテキスト](../../apps/api/src/trpc/context.ts)
- [アーキテクチャ設計書](../../docs/architecture.md)

## 注意事項

- Supabaseプロジェクトは事前に作成済みであることを前提
- ローカル開発時は `supabase start` でローカルSupabaseを使用
- Magic Linkのリダイレクト先URLはSupabaseダッシュボードで設定が必要
- 本番環境ではカスタムドメインのURL設定が必要

## 依存関係

### 新規パッケージ

```bash
# API
pnpm --filter @ai-trpg/api add @supabase/supabase-js

# Web
pnpm --filter @ai-trpg/web add @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Ready
