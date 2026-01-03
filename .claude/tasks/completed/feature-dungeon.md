# タスク: ダンジョンシステム実装

## 概要

ダンジョンのドメインモデル、DBスキーマ、API（CRUD）を実装する。キャラクターシステムと同様のVertical Slice構成で構築する。

## 背景

- セッション生成パイプラインの必須前提条件
- キャラクターとダンジョンを組み合わせて「共鳴」を発生させ、物語を生成する
- ダンジョンは「キャラの傷を抉り、問いに答えを迫る場所」として設計

## 要件

### 機能要件

- [x] ダンジョン一覧取得（公開ダンジョンのみ / 自分のダンジョン）
- [x] ダンジョン詳細取得
- [x] ダンジョン作成
- [x] ダンジョン更新
- [x] ダンジョン削除

### 非機能要件

- [x] 既存のCharacterパターンに準拠（一貫性）
- [x] Result型によるエラーハンドリング
- [x] Branded Typesの使用（DungeonId）

## 設計

### 影響範囲

| パッケージ | ファイル                                     | 変更内容            |
| ---------- | -------------------------------------------- | ------------------- |
| `shared`   | `domain/primitives/ids.ts`                   | DungeonId追加       |
| `shared`   | `domain/dungeon/`                            | 新規ドメインモデル  |
| `shared`   | `schemas/dungeon.ts`                         | Zodスキーマ追加     |
| `api`      | `infrastructure/database/schema/dungeons.ts` | DBスキーマ追加      |
| `api`      | `features/dungeon/`                          | 新規Feature Slice   |
| `api`      | `trpc/router.ts`                             | dungeonルーター追加 |

### ドメインモデル

設計書（docs/design.md）に基づくダンジョン構造:

```typescript
// packages/shared/src/domain/dungeon/types.ts

// === Branded Types ===
export type DungeonId = Brand<string, "DungeonId">;

// === Value Objects ===

/** ダンジョンのロア（3つの時間軸） */
export interface DungeonLore {
  readonly past: string; // かつての姿
  readonly fall: string; // 堕落の経緯
  readonly now: string; // 現在の状態
}

/** 層（レイヤー）*/
export interface DungeonLayer {
  readonly name: string; // "外縁 - 沈黙の参道"
  readonly atmosphere: string; // 雰囲気の描写
  readonly possibleEvents: readonly string[]; // 発生しうるイベント
}

/** 核心（コア）*/
export interface DungeonCore {
  readonly nature: CoreNature; // 選択 | 対決 | 発見 | 喪失 | 解放
  readonly description: string; // 核心の描写
  readonly possibleOutcomes: readonly string[]; // 可能な結末
}

export type CoreNature =
  | "choice"
  | "confrontation"
  | "discovery"
  | "loss"
  | "liberation";

/** 共鳴トリガー */
export interface ResonanceTrigger {
  readonly fragmentType: FragmentCategory; // origin | loss | mark | sin | quest | trait
  readonly keywords: readonly string[]; // マッチするキーワード
  readonly effect: string; // 発動時の効果描写
}

/** 試練タイプ */
export type TrialType =
  | "combat" // 戦闘
  | "exploration" // 探索
  | "puzzle" // 謎解き
  | "moral_choice" // 道徳選択
  | "inner_confrontation" // 内面対峙
  | "survival" // 生存
  | "negotiation"; // 交渉

/** 難易度トーン */
export type DifficultyTone = "light" | "normal" | "heavy" | "desperate";

// === Entity ===

export interface Dungeon {
  readonly _tag: "Dungeon";
  readonly id: DungeonId;
  readonly authorId: UserId; // 作成者（system or ユーザー）
  readonly name: string; // "忘却の聖堂"
  readonly alias: string; // "神が目を逸らした場所"
  readonly layerCount: number; // 層数
  readonly recommendedParty: string; // "2〜4人"
  readonly difficultyTone: DifficultyTone;
  readonly tags: readonly string[]; // ["#朽ちた神聖", "#悔恨", ...]
  readonly trialTypes: readonly TrialType[];
  readonly lore: DungeonLore;
  readonly layers: readonly DungeonLayer[];
  readonly core: DungeonCore;
  readonly resonance: readonly ResonanceTrigger[];
  readonly isPublic: boolean;
  readonly playCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### DBスキーマ

```typescript
// apps/api/src/infrastructure/database/schema/dungeons.ts

export const dungeons = pgTable("dungeons", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull(),

  // Basic Info
  name: text("name").notNull(),
  alias: text("alias").notNull().default(""),
  layerCount: integer("layer_count").notNull().default(3),
  recommendedParty: text("recommended_party").notNull().default("2〜4人"),
  difficultyTone: text("difficulty_tone").notNull().default("normal"),

  // JSONB fields
  tags: jsonb("tags").notNull().$type<string[]>().default([]),
  trialTypes: jsonb("trial_types").notNull().$type<string[]>().default([]),
  lore: jsonb("lore").notNull().$type<DungeonLoreJson>(),
  layers: jsonb("layers").notNull().$type<DungeonLayerJson[]>().default([]),
  core: jsonb("core").notNull().$type<DungeonCoreJson>(),
  resonance: jsonb("resonance")
    .notNull()
    .$type<ResonanceTriggerJson[]>()
    .default([]),

  // Settings
  isPublic: boolean("is_public").notNull().default(false),
  playCount: integer("play_count").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

### API

| エンドポイント     | メソッド | 認証 | 説明                 |
| ------------------ | -------- | ---- | -------------------- |
| `dungeon.list`     | Query    | 不要 | 公開ダンジョン一覧   |
| `dungeon.listMine` | Query    | 要   | 自分のダンジョン一覧 |
| `dungeon.get`      | Query    | 不要 | 詳細取得             |
| `dungeon.create`   | Mutation | 要   | 新規作成             |
| `dungeon.update`   | Mutation | 要   | 更新（自分のみ）     |
| `dungeon.delete`   | Mutation | 要   | 削除（自分のみ）     |

## 実装手順

1. [x] `shared/domain/primitives/ids.ts` に `DungeonId` 追加
2. [x] `shared/domain/dungeon/` にドメインモデル作成
   - `types.ts` - 型定義
   - `operations.ts` - ファクトリ関数、バリデーション
   - `index.ts` - エクスポート
3. [x] `shared/schemas/dungeon.ts` にZodスキーマ追加
4. [x] `shared/schemas/index.ts` にエクスポート追加
5. [x] `shared/domain/index.ts` にエクスポート追加
6. [x] `api/infrastructure/database/schema/dungeons.ts` 作成
7. [x] `api/infrastructure/database/schema/index.ts` にエクスポート追加
8. [x] `api/features/dungeon/` にFeature Slice作成
   - `repository.ts` - DBアクセス
   - `mapper.ts` - DB ↔ ドメイン変換
   - `useCases/` - ビジネスロジック
   - `router.ts` - tRPCルーター
   - `index.ts` - エクスポート
9. [x] `api/trpc/router.ts` に dungeonルーター追加
10. [x] `pnpm lint -- --fix` 実行
11. [x] `pnpm typecheck` 実行

## テスト計画

- [ ] 手動テスト: tRPC経由でCRUD操作確認
- [x] 型チェック: `pnpm typecheck` パス

## 完了条件

- [x] 全ての要件が実装されている
- [x] `pnpm lint` がパス（警告なし）
- [x] `pnpm typecheck` がパス
- [x] Characterパターンとの一貫性が保たれている
- [x] ドメインモデルが設計書（docs/design.md）と整合している

## 参考

- [設計書](../../docs/design.md) - ダンジョンシステムの詳細仕様
- [Character実装](../../packages/shared/src/domain/character/) - 参考パターン
- [Character DBスキーマ](../../apps/api/src/infrastructure/database/schema/characters.ts) - 参考パターン
- [Character Feature](../../apps/api/src/features/character/) - 参考パターン

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Complete
**完了日:** 2026-01-01
**PR:** https://github.com/sano-suguru/ai-trpg/pull/2
