# タスク: シードデータ投入 + 詳細ページ

## 概要

サンプルのキャラクターとダンジョンデータを投入し、詳細ページを作成してゲームの世界観を体験できるようにする。

## 背景

- 現在、一覧ページは存在するがデータが空の状態
- デモとして見せるためにはサンプルデータが必要
- 詳細ページがないと、キャラクターやダンジョンの情報を深く見れない
- 認証なしでも「世界観を見る」体験は提供可能

## 前提条件

- [ ] DBテーブル（characters, dungeons）が作成済み
  - `drizzle.config.ts` を作成
  - `npx drizzle-kit push` でスキーマをDBに反映

## 要件

### 機能要件

- [ ] サンプルキャラクター（3-5体）がDBに存在する
- [ ] サンプルダンジョン（2-3個）がDBに存在する
- [ ] キャラクター詳細ページ（/characters/:id）で断片・行動指針・経歴が表示される
- [ ] ダンジョン詳細ページ（/dungeons/:id）でロア・層構造・核心が表示される
- [ ] 一覧ページからカードをクリックして詳細へ遷移できる

### 非機能要件

- [ ] シードデータはdocs/design.mdの世界観に沿った内容
- [ ] シード投入はCLIコマンドで実行可能
- [ ] 冪等性あり（再実行しても重複しない）

## 設計

### 影響範囲

| パッケージ | ファイル                        | 変更内容                       |
| ---------- | ------------------------------- | ------------------------------ |
| `api`      | `src/scripts/seed.ts`           | シードスクリプト               |
| `api`      | `src/data/characters.ts`        | サンプルキャラクターデータ     |
| `api`      | `src/data/dungeons.ts`          | サンプルダンジョンデータ       |
| `api`      | `package.json`                  | seedコマンド追加               |
| `web`      | `src/routes/characters.$id.tsx` | キャラクター詳細ページ         |
| `web`      | `src/routes/dungeons.$id.tsx`   | ダンジョン詳細ページ           |
| `web`      | `src/components/character/`     | キャラクター表示コンポーネント |
| `web`      | `src/components/dungeon/`       | ダンジョン表示コンポーネント   |

### サンプルデータ

#### キャラクター例

```yaml
# 灰村のセド（docs/design.mdより）
name: "灰村のセド"
title: "贖いを探す者"
fragments:
  origin: "灰燼の街の生き残り"
  loss: "愛した人を自らの手で葬った"
  mark: "焼け焦げた指先"
  sin: "殺した数だけ夜に夢を見る"
  quest: "罪を贖える死に場所を探している"
directives:
  danger: "仲間を下がらせ、殿を務める"
  ally_in_peril: "何を犠牲にしても助ける"
  moral_choice: "弱い者の側に立つ"
  unknown: "警戒し、距離を取る"
biography: |
  灰燼の街が焼け落ちた夜、彼は最愛の人を
  自らの手で殺さねばならなかった。
  ...
lending: "safe"
isPublic: true
```

#### ダンジョン例

```yaml
# 忘却の聖堂（docs/design.mdより）
name: "忘却の聖堂"
alias: "神が目を逸らした場所"
layerCount: 3
difficulty: "heavy"
tags: ["#朽ちた神聖", "#悔恨", "#帰れない者たち"]
trialTypes: ["moral_choice", "inner_confrontation", "negotiation"]
lore:
  past: "かつて癒しの聖者を祀る聖堂があった..."
  fall: "司祭が禁忌を犯した夜..."
  now: "今も夜ごと鐘が鳴る..."
layers: [...]
core:
  nature: "choice"
  description: "司祭の亡霊は問う..."
  possibleOutcomes: [...]
resonance: [...]
isOfficial: true
```

### API

| エンドポイント  | メソッド | 認証 | 説明             |
| --------------- | -------- | ---- | ---------------- |
| `character.get` | Query    | 不要 | 単体取得（既存） |
| `dungeon.get`   | Query    | 不要 | 単体取得（既存） |

### ページ構成

```
/characters/:id
├── ヘッダー（名前、称号）
├── 断片セクション
│   ├── 出自
│   ├── 喪失
│   ├── 刻印
│   ├── 業（あれば）
│   └── 探求（あれば）
├── 行動指針セクション
├── 経歴セクション
├── 口調サンプル（あれば）
└── 借用設定表示

/dungeons/:id
├── ヘッダー（名前、異名）
├── 基本情報（層数、難易度、タグ）
├── ロアセクション（過去/崩壊/現在）
├── 試練タイプ
├── 層構造概要
└── 核心のヒント（ネタバレ注意）
```

## 実装手順

### Phase 1: シードデータ

1. [ ] サンプルデータ定義
   - `api/src/data/characters.ts` - 3-5体のキャラクター
   - `api/src/data/dungeons.ts` - 2-3個のダンジョン

2. [ ] シードスクリプト作成
   - `api/src/scripts/seed.ts`
   - 既存データ確認（冪等性）
   - データ挿入

3. [ ] package.jsonにコマンド追加
   - `pnpm --filter @ai-trpg/api seed`

4. [ ] シード実行・確認

### Phase 2: 詳細ページ

5. [ ] キャラクター詳細ページ
   - `web/src/routes/characters.$id.tsx`
   - TanStack Router動的ルート

6. [ ] キャラクター表示コンポーネント
   - `web/src/components/character/CharacterDetail.tsx`
   - `web/src/components/character/FragmentList.tsx`
   - `web/src/components/character/DirectiveList.tsx`

7. [ ] ダンジョン詳細ページ
   - `web/src/routes/dungeons.$id.tsx`

8. [ ] ダンジョン表示コンポーネント
   - `web/src/components/dungeon/DungeonDetail.tsx`
   - `web/src/components/dungeon/LoreSection.tsx`
   - `web/src/components/dungeon/LayerOverview.tsx`

9. [ ] 一覧ページからのリンク
   - `characters.tsx` のカードをLinkに
   - `dungeons.tsx` のカードをLinkに

### Phase 3: 仕上げ

10. [ ] `pnpm lint -- --fix` 実行

11. [ ] `pnpm typecheck` 実行

12. [ ] 動作確認

## テスト計画

- [ ] シードスクリプトが正常に実行される
- [ ] 一覧ページにサンプルデータが表示される
- [ ] 詳細ページに遷移できる
- [ ] 詳細ページで全情報が表示される
- [ ] 存在しないIDでは404が表示される

## 完了条件

- [ ] 全ての要件が実装されている
- [ ] `pnpm lint` がパス（警告なし）
- [ ] `pnpm typecheck` がパス
- [ ] サンプルデータが表示される
- [ ] 詳細ページが機能する

## 既存コード参照

### キャラクタードメインモデル

`packages/shared/src/domain/character/types.ts`:

```typescript
// Character の完全な型定義
export interface Character {
  readonly _tag: "Character";
  readonly id: CharacterId;
  readonly ownerId: UserId;
  readonly name: CharacterName;
  readonly title: CharacterTitle;
  readonly fragments: CharacterFragments;
  readonly directives: CharacterDirectives;
  readonly biography: Biography;
  readonly voiceSamples: readonly VoiceSample[];
  readonly history: readonly HistoryEntry[];
  readonly relationships: readonly Relationship[];
  readonly currentWounds: readonly string[];
  readonly currentQuestions: readonly string[];
  readonly lending: LendingSetting; // "all" | "safe" | "private"
  readonly isPublic: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### ダンジョンドメインモデル

`packages/shared/src/domain/dungeon/types.ts`:

```typescript
export interface Dungeon {
  readonly _tag: "Dungeon";
  readonly id: DungeonId;
  readonly authorId: UserId | null;
  readonly name: DungeonName;
  readonly alias: DungeonAlias | null;
  readonly layerCount: number;
  readonly difficulty: DifficultyLevel;
  readonly tags: readonly string[];
  readonly trialTypes: readonly TrialType[];
  readonly lore: DungeonLore;
  readonly layers: readonly DungeonLayer[];
  readonly core: DungeonCore;
  readonly resonance: readonly ResonanceTrigger[];
  readonly isOfficial: boolean;
  readonly playCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### APIルーターパターン

`apps/api/src/features/character/router.ts`:

```typescript
// get は protectedProcedure だが、シードデータ確認には listBorrowable を使用可能
listBorrowable: publicProcedure.query(async () => {
  const result = await listBorrowable();
  if (result.isErr()) {
    throw new TRPCError({ code: mapErrorCode(result.error), message: result.error.message });
  }
  return result.value;
}),
```

### フロントエンド一覧ページ

`apps/web/src/routes/characters.tsx`:

```typescript
// 現在の実装 - カードをリンクに変更する必要あり
{characters.map((char) => (
  <div key={char.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
    <h2 className="text-xl font-semibold">{char.name}</h2>
    {char.title && <p className="text-amber-500 text-sm">{char.title}</p>}
  </div>
))}
```

### TanStack Routerルート定義パターン

`apps/web/src/routes/characters.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/characters")({
  component: CharactersPage,
});
```

動的ルートは `$` プレフィックスを使用：

```typescript
// characters.$id.tsx
export const Route = createFileRoute("/characters/$id")({
  component: CharacterDetailPage,
});
```

## 参考

- [キャラクターシート例](../../docs/design.md#キャラシートフォーマット)
- [ダンジョンシート例](../../docs/design.md#ダンジョンシート完全フォーマット)
- [TanStack Router動的ルート](https://tanstack.com/router/latest/docs/framework/react/guide/route-params)

## 注意事項

- シードデータは開発環境専用（本番では別管理）
- docs/design.mdの例を忠実に再現
- 日本語のテキストは適切にエスケープ

## 依存関係

このタスクは認証に依存しない（publicProcedureのみ使用）

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Completed
**前提タスク:** なし（認証と並行可能）
