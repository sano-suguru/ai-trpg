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
│   └── layout/           # レイアウト（Header, Footer等）
├── pages/                # ページコンポーネント（将来のルーティング用）
├── stores/               # Zustand ストア
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ
└── style.css             # グローバルスタイル、Tailwind設定
```

## 技術スタック

| 技術 | 用途 |
|------|------|
| React 18 | UIライブラリ |
| TypeScript | 型安全性 |
| Vite | ビルドツール |
| Tailwind CSS | スタイリング |
| shadcn/ui | UIコンポーネント |
| Zustand | 状態管理 |
| tRPC Client | API通信 |

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
--background: 0 0% 6%;        /* 深い闇 */
--foreground: 30 10% 90%;     /* 灰がかった白 */
--primary: 30 15% 50%;        /* 燻んだ琥珀 */
--destructive: 0 60% 40%;     /* 乾いた血 */
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

## 状態管理

### Zustandストア

```typescript
// stores/characterStore.ts
interface CharacterStore {
  characters: Character[];
  selectedId: CharacterId | null;
  actions: {
    select: (id: CharacterId) => void;
    clear: () => void;
  };
}
```

### tRPC統合

```typescript
// APIデータの取得
const { data, isLoading } = trpc.character.list.useQuery();

// ミューテーション
const createMutation = trpc.character.create.useMutation({
  onSuccess: () => {
    // キャッシュ更新
  },
});
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
```

## 開発時の注意

1. **コンポーネントはドメイン別に配置** - `character/`, `dungeon/` など
2. **shadcn/uiを優先使用** - 車輪の再発明を避ける
3. **Tailwindクラスを使用** - インラインスタイル禁止
4. **アクセシビリティ確保** - Radix UIのプリミティブを活用
