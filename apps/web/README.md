# @ai-trpg/web

React + Vite + Tailwind CSS で構築されたフロントエンドアプリケーション。

## ディレクトリ構成

```
src/
├── components/            # UIコンポーネント
│   ├── ui/               # shadcn/ui（汎用コンポーネント）
│   ├── character/        # キャラクター関連
│   ├── dungeon/          # ダンジョン関連
│   ├── session/          # セッション関連
│   └── layout/           # レイアウト（Header等）
├── routes/               # TanStack Router ルート定義
│   ├── __root.tsx        # ルートレイアウト
│   ├── index.tsx         # ホームページ (/)
│   ├── characters.tsx    # キャラクター一覧 (/characters)
│   └── dungeons.tsx      # ダンジョン一覧 (/dungeons)
├── stores/               # Zustand ストア
├── hooks/                # カスタムフック
│   └── useAuth.ts        # 認証フック
├── lib/                  # ユーティリティ
│   ├── trpc.ts           # tRPCクライアント設定
│   └── supabase.ts       # Supabaseクライアント
├── routeTree.gen.ts      # 自動生成されるルートツリー
└── style.css             # グローバルスタイル、Tailwind設定
```

## 技術スタック

| 技術            | 用途               |
| --------------- | ------------------ |
| React 19        | UIライブラリ       |
| TypeScript      | 型安全性           |
| Vite            | ビルドツール       |
| Tailwind CSS v4 | スタイリング       |
| TanStack Router | 型安全ルーティング |
| TanStack Query  | データフェッチング |
| tRPC Client     | API通信（型安全）  |
| shadcn/ui       | UIコンポーネント   |
| Zustand         | 状態管理（将来用） |

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

# プレビュー
pnpm preview
```

## テーマ設計

**ダークファンタジー「灰暦の世界」を表現するテーマ:**

```css
/* style.css のカラーパレット */
--background: 0 0% 6%; /* 深い闇 */
--foreground: 30 10% 90%; /* 灰がかった白 */
--primary: 30 15% 50%; /* 燻んだ琥珀 */
--destructive: 0 60% 40%; /* 乾いた血 */
```

- ダークモードがデフォルト
- 彩度を抑えた、灰がかったトーン
- 終末後の世界観を反映

## コンポーネント設計

### 原則

1. **Composition優先** - 小さな部品の組み合わせ
2. **Props over State** - 状態の所在を明確に
3. **shadcn/ui拡張** - アクセシビリティを維持しつつカスタマイズ
4. **モバイルファースト** - リプレイ閲覧はスマホでも

### コンポーネント命名

```
components/
├── ui/Button.tsx          # 汎用ボタン
├── character/
│   ├── CharacterCard.tsx  # キャラカード
│   └── FragmentSelector.tsx  # 断片選択
```

## ルーティング

TanStack Routerを使用したファイルベースルーティング。

```
src/routes/
├── __root.tsx        # ルートレイアウト（Header, Outlet）
├── index.tsx         # / (ホームページ)
├── login.tsx         # /login (ログインページ)
├── characters.tsx    # /characters
└── dungeons.tsx      # /dungeons
```

### ルート定義

```typescript
// routes/characters.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/characters")({
  component: CharactersPage,
});
```

### リンク

```tsx
import { Link } from "@tanstack/react-router";

<Link to="/characters">キャラクター</Link>;
```

## 状態管理

### サーバー状態: TanStack Query + tRPC

```typescript
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

function CharactersPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.character.listBorrowable.queryOptions(),
  );
  // ...
}
```

### クライアント状態: Zustand（将来用）

```typescript
// stores/characterStore.ts
interface CharacterStore {
  selectedId: CharacterId | null;
  actions: {
    select: (id: CharacterId) => void;
    clear: () => void;
  };
}
```

## shadcn/ui

### インストール済みコンポーネント

```bash
# コンポーネント追加時
pnpm dlx shadcn@latest add [component-name]
```

### カスタマイズ

shadcn/uiはコード所有方式。`components/ui/` 内のファイルを直接編集可能。

## 環境変数

```bash
# .env
VITE_API_URL=http://localhost:8787
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from npx supabase status>
```

## 開発時の注意

1. **コンポーネントはドメイン別に配置** - `character/`, `dungeon/` など
2. **shadcn/uiを優先使用** - 車輪の再発明を避ける
3. **Tailwindクラスを使用** - インラインスタイル禁止
4. **アクセシビリティ確保** - Radix UIのプリミティブを活用
