# AI-TRPG アーキテクチャ設計書

> 灰暦の世界 - The World of Ashen Calendar

---

## 技術スタック

### 制約条件（選定の前提）

本プロジェクトは以下の制約のもとで技術選定を行った：

- **コスト**: 個人開発のため、**無料枠で運用可能**であること
- **スケール**: MVP段階では小規模（DAU 100未満）を想定
- **開発速度**: 1人での開発のため、**型安全性による自己防衛**を重視
- **運用負荷**: サーバー管理を避け、**サーバーレス/マネージド**を優先

### 選定結果と意思決定の背景

| レイヤー | 技術 | 検討した代替案 | 選定理由 |
|----------|------|---------------|----------|
| **フロントエンド** | React + TypeScript + Vite | Vue/Nuxt, Svelte, Next.js | Vueは型推論がReactより弱い。Next.jsはCloudflare Pagesとの相性が不安定（App Router）。SvelteはtRPC統合が未成熟。Reactエコシステムの成熟度を優先 |
| **バックエンド** | Hono | Express, Fastify, itty-router | ExpressはCloudflare Workers非対応。Fastifyも同様。itty-routerは軽量だがミドルウェアエコシステムが貧弱。HonoはWeb標準準拠かつCloudflare公式推奨 |
| **ホスティング** | Cloudflare Pages/Workers | Vercel, Netlify, AWS Lambda | Vercelは無料枠の帯域制限が厳しい。AWS Lambdaはコールドスタートが遅い。Cloudflareは10万req/日の無料枠とエッジ実行による低レイテンシが決め手 |
| **データベース** | Supabase (PostgreSQL) | PlanetScale, Neon, Turso | PlanetScaleは無料プラン廃止。Neonは無料枠が小さい。TursoはSQLiteベースでJSONB機能が限定的。Supabaseは認証・リアルタイム込みで500MB無料 |
| **ORM** | Drizzle ORM | Prisma, Kysely | Prismaはバンドルサイズが大きくエッジ環境に不向き。Kyselyは型安全だがマイグレーション機能がない。Drizzleは軽量かつエッジ対応 |
| **API** | tRPC | REST, GraphQL | 詳細は「API設計」セクション参照 |
| **LLM** | 複数プロバイダー抽象化 | 単一プロバイダー固定 | 詳細は「LLM統合設計」セクション参照 |
| **状態管理** | Zustand | Redux, Jotai, Recoil | Reduxはボイラープレートが多い。JotaiはtRPCとの統合パターンが少ない。Zustandは最小限のAPIで十分な機能を提供 |
| **スタイリング** | Tailwind CSS | CSS Modules, styled-components | CSS Modulesは命名規約の一貫性維持が困難。styled-componentsはランタイムコストがある。Tailwindはユーティリティクラスで高速開発可能 |
| **UIコンポーネント** | shadcn/ui | MUI, Chakra UI, Mantine | MUI/ChakraはバンドルサイズとTailwind統合に難。Mantineは良いがshadcn/uiの方がカスタマイズ自由度が高い（コード所有方式） |
| **エラーハンドリング** | neverthrow | try-catch, Effect | 詳細は「エラーハンドリング設計」セクション参照 |

### 無料枠まとめ

| サービス | 無料枠 | 備考 |
|----------|--------|------|
| Cloudflare Workers | 100,000 req/日 | エッジ実行 |
| Cloudflare Pages | 無制限ビルド | 500ビルド/月 |
| Supabase | 500MB DB, 1GB Storage | 認証・リアルタイム込み |
| Google AI Studio | 250K tokens/分 | 20 req/日制限 |
| Groq | 1,000 req/日 | 高速推論 |
| GitHub Models | Copilot Free連携 | 開発用途 |

---

## システムアーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                     クライアント (Browser)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React SPA (Vite)                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ キャラ作成   │ │ ダンジョン  │ │ リプレイビューア    │  │  │
│  │  │ ウィザード   │ │ セレクター  │ │                     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │                         │                                   │  │
│  │  ┌─────────────────────┴───────────────────────────────┐  │  │
│  │  │              Zustand Store (状態管理)                 │  │  │
│  │  │  - AuthStore / CharacterStore / SessionStore         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers (Edge)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Hono API Server                        │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │                   Middleware Chain                    │ │  │
│  │  │  Logger → CORS → Auth → RateLimit → Validation       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │  │
│  │  │ /api/auth   │ │/api/chars   │ │ /api/sessions       │ │  │
│  │  │ 認証プロキシ │ │ キャラCRUD  │ │ セッション生成       │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐                         │  │
│  │  │/api/dungeons│ │/api/replays │                         │  │
│  │  │ ダンジョン   │ │ リプレイ     │                         │  │
│  │  └─────────────┘ └─────────────┘                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    Supabase      │ │   LLM Gateway    │ │  Cloudflare R2   │
│                  │ │                  │ │   (将来拡張)      │
│ ┌──────────────┐ │ │ ┌──────────────┐ │ │                  │
│ │  PostgreSQL  │ │ │ │ LLMService   │ │ │ - キャラ画像     │
│ │  - users     │ │ │ │ (抽象化層)   │ │ │ - リプレイ画像   │
│ │  - chars     │ │ │ └──────────────┘ │ │                  │
│ │  - dungeons  │ │ │        │         │ │                  │
│ │  - sessions  │ │ │   ┌────┴────┐    │ │                  │
│ │  - replays   │ │ │   ▼         ▼    │ │                  │
│ └──────────────┘ │ │ Gemini   Groq    │ │                  │
│ ┌──────────────┐ │ │ GitHub   OpenRouter│                  │
│ │  Auth        │ │ │                  │ │                  │
│ │  - OAuth     │ │ └──────────────────┘ └──────────────────┘
│ │  - Magic Link│ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │  Realtime    │ │
│ │  - 通知      │ │
│ │  - 進捗更新  │ │
│ └──────────────┘ │
└──────────────────┘
```

### データフロー

```
[キャラ作成フロー]
User → React UI → Zustand → Hono API → Supabase
                                ↓
                         LLM (断片→人物像生成)
                                ↓
                         Supabase (保存)

[セッション生成フロー]
User → React UI → Hono API → LLM Gateway
                      ↓
              1. 共鳴スキャン (ローカル処理)
              2. プロット生成 (LLM: Gemini)
              3. シーン生成 (LLM: Groq/Llama)
              4. 結合・保存 (Supabase)
                      ↓
              Realtime → React UI (進捗通知)
```

---

## プロジェクト構成

### モノレポ構成

pnpm workspaces + Turborepo によるモノレポ構成を採用。

```
apps/
├── web/      # フロントエンド（React + Vite + Tailwind + shadcn/ui）
└── api/      # バックエンド（Hono + Cloudflare Workers）
packages/
├── shared/           # 共有コード（型、スキーマ、ユーティリティ）
├── typescript-config/  # 共有TypeScript設定
└── eslint-config/      # 共有ESLint設定
```

**採用理由:**
- `apps/` と `packages/` の分離でデプロイ対象と共有ライブラリを明確に区別
- 型定義を一箇所で管理し、フロント・バックエンドで共有
- 独立したデプロイが可能（webとapiは別々にデプロイ）
- 将来のパッケージ追加が容易（Phase 2以降で `community/`, `guild/` など）

### パッケージ依存関係

```
shared ← web
shared ← api
```

- `web` と `api` は `shared` に依存してよい
- `web` と `api` は互いに依存してはならない
- `shared` は外部パッケージ以外に依存してはならない

### 配置ルール

| 種類 | 配置先 | 理由 |
|------|--------|------|
| **ドメインモデル** | `packages/shared/domain/{entity}/` | フロント・バックエンド共通で使用。FDMによる型安全なモデル |
| **ドメインプリミティブ** | `packages/shared/domain/primitives/` | Branded ID型（UserId, CharacterId等） |
| **エラー型** | `packages/shared/types/` | ドメインエラーの定義 |
| **Zodスキーマ** | `packages/shared/schemas/` | API入力バリデーション用 |
| **マスターデータ** | `packages/shared/constants/` | 断片・行動指針などの選択肢 |
| **Feature Slice** | `apps/api/features/{domain}/` | UseCase, Repository, Router, Mapper |
| **DBスキーマ** | `apps/api/infrastructure/database/schema/` | Drizzle ORMスキーマ定義 |
| **API固有の型** | `apps/api/types/` | Cloudflare Bindings等 |
| **UIコンポーネント** | `apps/web/components/` | 機能ドメイン別にサブディレクトリ |

### 命名規約

| 対象 | 規約 | 例 |
|------|------|-----|
| ディレクトリ | `kebab-case` | `character-sheet/` |
| TypeScriptファイル | `camelCase.ts` | `characterStore.ts` |
| Reactコンポーネント | `PascalCase.tsx` | `CharacterCard.tsx` |
| 型・インターフェース | `PascalCase` | `Character`, `SessionStatus` |
| 関数・変数 | `camelCase` | `createCharacter()` |
| 定数 | `UPPER_SNAKE_CASE` | `MAX_PARTY_SIZE` |
| 環境変数 | `UPPER_SNAKE_CASE` | `SUPABASE_URL` |

### 禁止事項

- **循環依存の禁止**: パッケージ間、モジュール間ともに循環参照は禁止
- **相対パス深掘り禁止**: `../../../` のような深い相対パスは使用しない（エイリアス `@/` を使用）
- **any型の禁止**: 原則 `unknown` を使用し、型ガードで絞り込む
- **console.log の本番残留禁止**: ロガーを使用する

---

## Functional Domain Modeling (FDM)

### なぜFDMか

**解決したい課題:**
- TypeScriptの構造的型付けでは、同じ形状の型が区別できない（`UserId`と`CharacterId`が両方`string`だと混同可能）
- オブジェクトの不正な状態を型レベルで防ぎたい
- ドメインロジックをUIやインフラから分離したい

**検討した選択肢:**

| 選択肢 | 評価 |
|--------|------|
| **素のTypeScript** | ID混同バグが発生しやすい。バリデーション漏れがコンパイル時に検出不可 |
| **fp-ts** | 強力だが学習コストが高い。型定義が複雑 |
| **Branded Types + neverthrow** | **採用**。最小限のボイラープレートで公称型とResult型を実現 |

### 設計原則

| 原則 | 説明 |
|------|------|
| **Branded Types（公称型）** | `Brand<string, "UserId">` で型安全なID |
| **Smart Constructors** | ファクトリ関数が `Result<T, ValidationError>` を返す |
| **Immutable by default** | 全ての型に `readonly` 修飾子 |
| **Make Illegal States Unrepresentable** | Discriminated Unionでありえない状態を型で排除 |

---

## Vertical Slice Architecture

### なぜVertical Sliceか

**解決したい課題:**
- レイヤードアーキテクチャでは機能追加時に複数レイヤーを横断して変更が必要
- 機能間の依存関係が見えにくい
- テスト時にモック対象が多くなる

**検討した選択肢:**

| 選択肢 | 評価 |
|--------|------|
| **レイヤードアーキテクチャ** | 機能追加時に `controllers/`, `services/`, `repositories/` 全てを変更。凝集度が低い |
| **Clean Architecture** | 強力だが、MVPには過剰。インターフェース定義のボイラープレートが多い |
| **Vertical Slice** | **採用**。機能単位でコードを凝集。変更時の影響範囲が明確 |

### 設計原則

| 原則 | 説明 |
|------|------|
| **Feature単位で凝集** | 1つの機能に必要なコードを1ディレクトリに集約 |
| **依存性の注入** | UseCaseはRepositoryインターフェースに依存。実装は外から注入 |
| **インフラは外側** | DB接続、外部API呼び出しは `infrastructure/` に分離 |

### Feature Slice構成

各Feature（例: `character/`）は以下で構成:
- `router.ts` - tRPCルーター定義
- `repository.ts` - Repositoryインターフェース + 実装
- `mapper.ts` - DB行 ⇔ ドメインモデル変換
- `useCases/` - 各ユースケース（create, get, list, update, delete）

---

## UIコンポーネント設計

### なぜこの構成か

**解決したい課題:**
- アクセシビリティ対応を一から実装する工数がない
- デザインシステムの一貫性を1人で維持するのは困難
- しかし、世界観（灰暦のダークファンタジー）に合わせたカスタマイズは必須

**shadcn/uiを選んだ理由:**

| 検討した選択肢 | 却下理由 |
|---------------|----------|
| **MUI / Chakra UI** | バンドルサイズが大きい。Tailwindとの併用が煩雑。デザイントークンの上書きが面倒 |
| **Headless UI** | アクセシビリティは確保できるが、スタイリングを全て自前で書く必要がある |
| **Mantine** | 良い選択肢だが、Tailwind統合がネイティブでない |
| **フルスクラッチ** | 工数的に非現実的。アクセシビリティの専門知識も不足 |

**shadcn/uiの決め手:**
- Radix UIベースでアクセシビリティが担保済み
- **コード所有方式**: node_modulesではなくプロジェクト内にコピーされるため、世界観に合わせた深いカスタマイズが可能
- Tailwind CSSとネイティブ統合

### テーマ設計の意図

「灰暦の世界」のダークファンタジー感を表現するため、**ダークモードをデフォルト**とした。

**カラーパレットの設計意図:**
- `--background: 0 0% 6%` - 深い闇（終末後の世界）
- `--primary: 30 15% 50%` - 燻んだ琥珀（かつての栄光の残滓）
- `--destructive: 0 60% 40%` - 乾いた血（危険・警告）
- 彩度を抑え、灰がかったトーンで統一

テーマのCSS変数定義は `apps/web/src/style.css` を参照。

### ディレクトリ構成

```
apps/web/src/components/
├── ui/           # shadcn/uiコンポーネント（自動生成、カスタマイズ可）
├── character/    # キャラクター関連（CharacterCard, FragmentSelector等）
├── dungeon/      # ダンジョン関連
├── session/      # セッション関連
└── layout/       # レイアウト（Header, ThemeProvider等）
```

### コンポーネント設計原則

| 原則 | なぜ |
|------|------|
| **Composition優先** | 小さな部品の組み合わせは、大きなコンポーネントより再利用性が高く、テストしやすい |
| **Props over State** | 状態の所在が明確になり、デバッグが容易。React DevToolsでの追跡も簡単 |
| **shadcn/ui拡張** | 車輪の再発明を避け、アクセシビリティを維持しつつカスタマイズ |
| **モバイルファースト** | TRPGはPCメインだが、リプレイ閲覧はスマホでも行う想定 |

---

## データモデル

### なぜこの設計か

**正規化レベルの判断:**

本プロジェクトでは**第3正規形を基本としつつ、一部でJSONBを活用**する。

| データ | 正規化 or JSONB | 理由 |
|--------|----------------|------|
| **ユーザー・キャラ基本情報** | 正規化（リレーション） | 頻繁に検索・結合する。RLSで行レベル制御が必要 |
| **断片・行動指針** | JSONB | 配列として保持。個別検索は不要。スキーマ変更（断片追加）に柔軟 |
| **ダンジョン層構造** | JSONB | 深くネストした構造。層ごとのスキーマが異なる可能性 |
| **セッション履歴** | JSONB | 時系列データで追記専用。構造が可変 |
| **シーン本文** | JSONB | LLM出力をそのまま保存。構造化するメリットが薄い |

**検討した代替案:**
- **全て正規化**: JOIN地獄になる。スキーマ変更のたびにマイグレーション必要
- **全てNoSQL（MongoDB等）**: Supabaseの認証・リアルタイムを活用できない。トランザクションが弱い
- **採用案（ハイブリッド）**: PostgreSQLのJSONB機能で両方の利点を取る

**ソフトデリート不採用の理由:**
- 複雑性が増す（全クエリに `WHERE deleted_at IS NULL` 必要）
- GDPRの「削除権」対応時に物理削除が必要になる可能性
- MVP段階では過剰設計。CASCADE DELETEでシンプルに

### ER図

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   characters    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ user_id (FK)    │──┐
│ display_name    │  │    │ name            │  │
│ avatar_url      │  └───<│ title           │  │
│ created_at      │       │ fragments       │  │
│ updated_at      │       │ directives      │  │
└─────────────────┘       │ biography       │  │
                          │ voice_samples   │  │
                          │ lending         │  │
                          │ history         │  │
                          │ relationships   │  │
                          │ is_public       │  │
                          │ created_at      │  │
                          │ updated_at      │  │
                          └─────────────────┘  │
                                               │
┌─────────────────┐       ┌─────────────────┐  │
│    dungeons     │       │    sessions     │  │
├─────────────────┤       ├─────────────────┤  │
│ id (PK)         │──┐    │ id (PK)         │  │
│ author_id (FK)  │  │    │ user_id (FK)    │──┘
│ name            │  │    │ dungeon_id (FK) │──┐
│ alias           │  └───<│ party (JSON)    │  │
│ layer_count     │       │ status          │  │
│ difficulty      │       │ triggered_events│  │
│ tags            │       │ structure       │  │
│ trial_types     │       │ created_at      │  │
│ lore            │       │ completed_at    │  │
│ layers          │       └─────────────────┘  │
│ core            │              │             │
│ resonance       │              ▼             │
│ is_official     │       ┌─────────────────┐  │
│ play_count      │       │     replays     │  │
│ created_at      │       ├─────────────────┤  │
│ updated_at      │       │ id (PK)         │  │
└─────────────────┘       │ session_id (FK) │──┘
                          │ scenes (JSON)   │
                          │ epilogue        │
                          │ footer          │
                          │ created_at      │
                          └─────────────────┘
```

### スキーマ管理方針

**Drizzle ORM を採用。**

スキーマ定義は `packages/shared/src/db/schema/` に配置。Drizzle Kitでマイグレーション生成。

**設計原則:**

| 原則 | なぜ |
|------|------|
| **RLS必須** | Supabaseの認証と連携し、APIレイヤーでの権限チェック漏れを防ぐ最終防衛線 |
| **タイムスタンプ標準化** | 監査・デバッグ・キャッシュ無効化に必要。後から追加は困難 |
| **GINインデックス（タグ）** | JSONB配列の検索を高速化。タグ検索はユーザー体験に直結 |

**RLSポリシーの考え方:**
- 自分のデータ → 全操作可
- 他人の公開データ → 閲覧のみ
- 借用可能キャラ → `lending != 'private'` で閲覧可（セッション参加用）

---

## API設計

### なぜtRPCか（REST/GraphQLとの比較）

**解決したい課題:**
- フロントとバックエンドで型定義を二重管理したくない
- APIスキーマのCodegen運用コストを避けたい
- 1人開発で型の不整合によるバグを防ぎたい

**検討した選択肢:**

| 選択肢 | 却下理由 |
|--------|----------|
| **REST** | OpenAPI定義 → Codegen → 型生成のパイプラインが必要。型が実装と乖離するリスク |
| **GraphQL** | スキーマ定義とCodegenが必要。オーバーフェッチ/アンダーフェッチ問題は本プロジェクトでは発生しにくい（画面ごとに必要なデータが明確） |
| **tRPC** | **採用**。モノレポ内で型定義を直接共有。Codegen不要。Zodスキーマを再利用可能 |

**tRPCの制約（認識した上で採用）:**
- TypeScriptモノレポ前提。他言語クライアントには不向き
- 公開APIには不向き（将来サードパーティ連携時は別途REST APIを追加）

### 設計方針

| 方針 | なぜ |
|------|------|
| **tRPC over Hono** | HonoのミドルウェアエコシステムとtRPCの型安全性を両立 |
| **publicProcedure / protectedProcedure** | 認証要否をコードで明示。レビュー時に一目で判別可能 |
| **Zodスキーマ共有** | `shared/schemas/` のスキーマをAPI入力検証にそのまま使用。定義の一元化 |

### ルーター構成

| ルーター | プロシージャ例 | 認証 |
|----------|---------------|------|
| `auth` | `getSession`, `signOut` | 一部不要 |
| `characters` | `listPublic`, `listMine`, `get`, `create`, `update`, `delete` | 公開取得は不要 |
| `dungeons` | `list`, `get` | 不要 |
| `sessions` | `create`, `get`, `listMine` | 要 |
| `fragments` | `list` | 不要 |

### リアルタイム通信

tRPCはリクエスト/レスポンス型。リアルタイム通信は別途対応：

| 用途 | 技術 | なぜ |
|------|------|------|
| **セッション生成進捗** | SSE | LLM生成は数秒〜数十秒かかる。進捗表示でUX改善 |
| **通知（Phase 2）** | Supabase Realtime | Supabaseに組み込み済み。追加インフラ不要 |

---

## エラーハンドリング設計

### なぜResult型か（例外との比較）

**解決したい課題:**
- `try-catch` だとエラーの型が `unknown` になり、何が起きうるか分からない
- 呼び出し元でエラーハンドリングを忘れてもコンパイルが通ってしまう
- エラーの伝播経路がコードから読み取りにくい

**検討した選択肢:**

| 選択肢 | 評価 |
|--------|------|
| **try-catch（例外）** | TypeScriptでは例外の型を表現できない。ハンドリング漏れがコンパイル時に検出不可 |
| **Effect** | 強力だが学習コストが高い。MVPには過剰 |
| **neverthrow** | **採用**。Result型でエラーを明示。軽量で導入が容易 |

**Result型の利点:**
- 関数シグネチャに「何が失敗しうるか」が明示される
- エラーハンドリングを忘れるとコンパイルエラー
- `andThen`, `map` でパイプライン的に処理を連結可能

### 使い方の指針

| 状況 | 型 |
|------|-----|
| 同期処理 | `Result<T, E>` |
| 非同期処理 | `ResultAsync<T, E>` |
| 複数結果の集約 | `Result.combine([...])` |

エラー型は `shared/types/errors.ts` でドメイン別に定義。

### レイヤー別の責務

| レイヤー | エラーの扱い |
|----------|-------------|
| **Service層** | ドメインエラーを `Result` で返す |
| **API Handler** | `Result` を受け取り、HTTPレスポンスに変換 |
| **フロントエンド** | `Result` をUIフィードバックに変換 |

---

## LLM統合設計

### なぜ複数プロバイダーか

**解決したい課題:**
- 無料枠で運用したいが、単一プロバイダーの無料枠だけでは不足
- プロバイダー障害時にサービス停止を避けたい
- 用途によって最適なモデルが異なる（構造生成 vs 文章生成）

**検討した選択肢:**

| 選択肢 | 評価 |
|--------|------|
| **OpenAI一本** | 無料枠がない。コストが高い |
| **Claude一本** | API無料枠がない |
| **単一無料プロバイダー** | 無料枠上限で詰む。障害時に全停止 |
| **複数プロバイダー抽象化** | **採用**。無料枠を組み合わせ、フォールバックで可用性確保 |

### プロバイダー選定と役割分担

| 用途 | プライマリ | なぜ | フォールバック |
|------|-----------|------|---------------|
| **プロット構造生成** | Gemini | 長いコンテキスト、構造理解が得意 | Groq |
| **シーン本文生成** | Groq (Llama) | 高速、日本語品質が十分 | GitHub Models |
| **キャラ補助生成** | Groq | 短文生成は速度重視 | Gemini |

**フォールバック戦略:**
1. プライマリにリクエスト
2. 失敗（レート制限 or エラー）→ 次のプロバイダーへ
3. 全て失敗 → ユーザーに「しばらく待ってから再試行」を案内

### セッション生成フロー

```
1. 共鳴スキャン (ローカル) - LLM不使用、高速
2. プロット生成 (LLM)     - 物語骨子をYAML形式で
3. シーン生成 (LLM × N)   - 各シーン400-600字
4. 結合・保存             - DBへリプレイ保存
5. 履歴更新               - キャラのhistory/relationships更新
```

プロンプトテンプレートは `apps/api/src/services/llm/prompts/` に配置。

---

## 拡張性設計

### Phase別の機能追加方針

| Phase | 追加機能 | 影響範囲 |
|-------|----------|----------|
| **Phase 2** | フォロー、リアクション、コメント、通知 | 新規テーブル追加、Realtime活用 |
| **Phase 3** | ギルド、実績 | 新規テーブル追加、新規パッケージ |
| **Phase 4** | ロア断片投稿、世界イベント | 新規テーブル追加、新規パッケージ |

### 拡張時の原則

| 原則 | 説明 |
|------|------|
| **新規パッケージとして追加** | 既存パッケージを肥大化させず、`packages/` に新規追加 |
| **既存APIに影響を与えない** | 新機能は新エンドポイントで提供 |
| **マイグレーションで追加** | スキーマ変更は必ずマイグレーションファイルで管理 |
| **Feature Flag検討** | 大きな機能は段階的にロールアウト可能に |

### APIバージョニング方針

- 現時点では `/api/` でバージョンなし
- 破壊的変更が必要になった時点で `/api/v1/`, `/api/v2/` を導入
- 旧バージョンは最低6ヶ月間維持

---

## 開発環境セットアップ

### 必要なツール

```bash
# Node.js 20+
node -v  # v20.x.x

# pnpm
npm install -g pnpm

# Wrangler (Cloudflare CLI)
pnpm install -g wrangler

# Supabase CLI
pnpm install -g supabase
```

### 初期セットアップコマンド

```bash
# リポジトリクローン後
cd ai-trpg

# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集

# Supabase ローカル起動
supabase start

# マイグレーション実行
supabase db push

# 開発サーバー起動
pnpm dev  # web + api 同時起動
```

### 環境変数

```bash
# .env.example

# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# LLM Providers
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
GITHUB_TOKEN=your-github-pat  # GitHub Models用

# App
VITE_API_URL=http://localhost:8787
```

---

## デプロイ戦略

### CI/CD 方針

**ワークフロー定義:** `.github/workflows/` を参照

| トリガー | アクション |
|----------|-----------|
| `main` プッシュ | 本番デプロイ（web + api） |
| PR作成 | プレビューデプロイ |
| PR更新 | プレビュー更新 |

**必要なSecrets:**
- `CF_API_TOKEN`: Cloudflare APIトークン
- `CF_ACCOUNT_ID`: CloudflareアカウントID

### 環境分離

| 環境 | API | Web | DB |
|------|-----|-----|-----|
| Local | localhost:8787 | localhost:5173 | Supabase Local |
| Preview | *.ai-trpg-api.workers.dev | *.ai-trpg.pages.dev | Supabase (staging) |
| Production | api.ai-trpg.com | ai-trpg.com | Supabase (prod) |

---

## 次のステップ

### MVP実装順序

1. **プロジェクト初期化**
   - モノレポセットアップ
   - 共通型定義
   - Supabaseスキーマ

2. **認証基盤**
   - Supabase Auth連携
   - Honoミドルウェア

3. **キャラクター機能**
   - CRUD API
   - 作成UI (断片選択 → AI生成)

4. **ダンジョン機能**
   - 初期データ投入
   - 選択UI

5. **セッション生成**
   - LLM統合
   - 生成パイプライン
   - リプレイ表示

6. **仕上げ**
   - エラーハンドリング
   - デプロイ
   - テスト

---

*このドキュメントは開発の進行に応じて更新されます。*

**最終更新: 2025-12-31**
