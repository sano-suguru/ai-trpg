# タスク: セッション生成機能

## 概要

パーティ編成とダンジョン選択後、AIがTRPGセッションを自動生成し、リプレイとして表示する機能を実装する。MVPの核心機能。

## 背景

- 「あなたの物語を、AIが紡ぎ出す」というゲームコンセプトの実現
- キャラクター作成、ダンジョン機能が完成した後の最終ステップ
- 共鳴システム、プロット生成、シーン生成のパイプラインを構築

## 要件

### 機能要件

- [ ] パーティ編成
  - [ ] 自分のキャラクターを選択
  - [ ] 借用可能なキャラクターを追加（2-4人パーティ）
  - [ ] パーティ確認画面

- [ ] ダンジョン選択
  - [ ] ダンジョン一覧から選択
  - [ ] 選択したダンジョンの詳細表示
  - [ ] 共鳴予測（パーティとの相性表示）

- [ ] セッション生成
  - [ ] 生成開始ボタン
  - [ ] 生成進捗表示（SSE）
  - [ ] 生成完了後、リプレイページへ遷移

- [ ] リプレイ表示
  - [ ] ヘッダー（ダンジョン名、パーティ、結末）
  - [ ] エピグラフ
  - [ ] シーン本文（Scene 1, 2, ...）
  - [ ] エピローグ
  - [ ] フッター（セッション記録、キャラ変化）

- [ ] 履歴更新
  - [ ] キャラクターのhistory追加
  - [ ] relationships追加
  - [ ] current_wounds追加（あれば）

### 非機能要件

- [ ] 生成時間は30秒〜2分程度
- [ ] 生成中の進捗がリアルタイムで表示される
- [ ] 生成失敗時はリトライまたはエラー表示
- [ ] リプレイは3,000〜5,000字程度

## 設計

### 影響範囲

| パッケージ | ファイル                                     | 変更内容                      |
| ---------- | -------------------------------------------- | ----------------------------- |
| `shared`   | `domain/session/`                            | Session, Replayドメインモデル |
| `shared`   | `schemas/session.ts`                         | セッションZodスキーマ         |
| `api`      | `infrastructure/database/schema/sessions.ts` | sessionsテーブル              |
| `api`      | `infrastructure/database/schema/replays.ts`  | replaysテーブル               |
| `api`      | `features/session/`                          | Session Feature Slice         |
| `api`      | `services/generation/`                       | 生成パイプライン              |
| `api`      | `services/generation/resonance.ts`           | 共鳴スキャン                  |
| `api`      | `services/generation/plot.ts`                | プロット生成                  |
| `api`      | `services/generation/scene.ts`               | シーン生成                    |
| `web`      | `routes/sessions.new.tsx`                    | セッション作成ページ          |
| `web`      | `routes/sessions.$id.tsx`                    | リプレイ表示ページ            |
| `web`      | `components/session/`                        | セッション関連UI              |

### 生成パイプライン

```
1. 共鳴スキャン (ローカル)
   - パーティの断片とダンジョンの共鳴トリガーを照合
   - triggered_events を生成

2. プロット生成 (LLM: Gemini)
   - 入力: パーティ、ダンジョン、triggered_events
   - 出力: structure (YAML形式の物語骨子)

3. シーン分割
   - structure から 5-8 シーンに分割

4. シーン本文生成 (LLM: Groq)
   - 各シーン 400-600字
   - 並列生成可能だが、順序依存あり

5. 結合・整形
   - 全シーンを結合
   - ヘッダー、エピグラフ、エピローグ、フッターを追加

6. 保存
   - sessionsテーブルに保存
   - replaysテーブルに保存

7. 履歴更新
   - キャラクターのhistory, relationships更新
```

### データモデル

```typescript
// Session
interface Session {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly dungeonId: DungeonId;
  readonly party: readonly CharacterId[];
  readonly status: SessionStatus; // 'pending' | 'generating' | 'completed' | 'failed'
  readonly triggeredEvents: readonly TriggeredEvent[];
  readonly structure: SessionStructure | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

// Replay
interface Replay {
  readonly id: ReplayId;
  readonly sessionId: SessionId;
  readonly header: ReplayHeader;
  readonly epigraph: string;
  readonly scenes: readonly Scene[];
  readonly epilogue: string;
  readonly footer: ReplayFooter;
  readonly createdAt: Date;
}

// Scene
interface Scene {
  readonly number: number;
  readonly title: string;
  readonly text: string;
}
```

### API

| エンドポイント     | メソッド         | 認証 | 説明                     |
| ------------------ | ---------------- | ---- | ------------------------ |
| `session.create`   | Mutation         | 要   | セッション作成・生成開始 |
| `session.get`      | Query            | 要   | セッション取得           |
| `session.listMine` | Query            | 要   | 自分のセッション一覧     |
| `session.stream`   | Subscription/SSE | 要   | 生成進捗ストリーム       |
| `replay.get`       | Query            | 不要 | リプレイ取得             |

### SSE進捗イベント

```typescript
type GenerationEvent =
  | { type: "started" }
  | { type: "resonance_complete"; triggeredCount: number }
  | { type: "plot_complete" }
  | { type: "scene_generating"; sceneNumber: number; total: number }
  | { type: "scene_complete"; sceneNumber: number }
  | { type: "completed"; replayId: ReplayId }
  | { type: "failed"; error: string };
```

## 実装手順

### Phase 1: ドメインモデル・DB

1. [ ] Sessionドメインモデル
   - `shared/domain/session/types.ts`
   - `shared/domain/session/operations.ts`

2. [ ] Replayドメインモデル
   - `shared/domain/replay/types.ts`

3. [ ] Zodスキーマ
   - `shared/schemas/session.ts`
   - `shared/schemas/replay.ts`

4. [ ] DBスキーマ
   - `api/infrastructure/database/schema/sessions.ts`
   - `api/infrastructure/database/schema/replays.ts`

5. [ ] マイグレーション実行

### Phase 2: 生成パイプライン

6. [ ] 共鳴スキャン
   - `api/services/generation/resonance.ts`
   - キャラ断片とダンジョン共鳴トリガーのマッチング

7. [ ] プロット生成
   - `api/services/generation/plot.ts`
   - プロンプトテンプレート作成
   - Gemini呼び出し

8. [ ] シーン生成
   - `api/services/generation/scene.ts`
   - プロンプトテンプレート作成
   - Groq呼び出し

9. [ ] パイプライン統合
   - `api/services/generation/pipeline.ts`
   - 各ステップの連結
   - エラーハンドリング

### Phase 3: API

10. [ ] Session Feature Slice
    - `api/features/session/repository.ts`
    - `api/features/session/mapper.ts`
    - `api/features/session/useCases/`

11. [ ] セッションルーター
    - `api/features/session/router.ts`
    - create, get, listMine

12. [ ] SSEエンドポイント
    - 生成進捗のリアルタイム配信

13. [ ] Replayルーター
    - `api/features/replay/router.ts`
    - get

### Phase 4: フロントエンド

14. [ ] パーティ編成UI
    - `web/components/session/PartyBuilder.tsx`
    - キャラ選択モーダル

15. [ ] ダンジョン選択UI
    - `web/components/session/DungeonSelector.tsx`
    - 共鳴予測表示

16. [ ] セッション作成ページ
    - `web/routes/sessions.new.tsx`
    - ステップウィザード

17. [ ] 生成進捗UI
    - `web/components/session/GenerationProgress.tsx`
    - SSE接続
    - プログレスバー

18. [ ] リプレイ表示ページ
    - `web/routes/sessions.$id.tsx`
    - リプレイビューア

19. [ ] リプレイコンポーネント
    - `web/components/replay/ReplayViewer.tsx`
    - `web/components/replay/Scene.tsx`

### Phase 5: 履歴更新

20. [ ] キャラクター履歴更新
    - セッション完了後にhistory, relationships更新
    - 借用キャラは設定に応じて更新

### Phase 6: 仕上げ

21. [ ] `pnpm lint -- --fix` 実行

22. [ ] `pnpm typecheck` 実行

23. [ ] 全フロー動作確認

## テスト計画

- [ ] パーティ編成が正しく動作する
- [ ] ダンジョン選択が正しく動作する
- [ ] 共鳴スキャンが正しくトリガーを検出する
- [ ] 生成が完了しリプレイが表示される
- [ ] 生成進捗がリアルタイムで表示される
- [ ] キャラクター履歴が更新される
- [ ] 生成失敗時にエラーが表示される

## 完了条件

- [ ] 全ての要件が実装されている
- [ ] `pnpm lint` がパス（警告なし）
- [ ] `pnpm typecheck` がパス
- [ ] パーティ編成→ダンジョン選択→生成→リプレイ表示の全フローが動作する
- [ ] 3,000〜5,000字のリプレイが生成される

## 既存コード参照

### 共鳴トリガー（ダンジョン側）

`packages/shared/src/domain/dungeon/types.ts`:

```typescript
export interface ResonanceTrigger {
  readonly fragmentType: FragmentCategory; // "origin" | "loss" | "mark" | "sin" | "quest" | "trait"
  readonly keywords: readonly string[];
  readonly effect: string;
}

// ダンジョンに含まれる共鳴設定例
resonance: [
  {
    fragmentType: "loss",
    keywords: ["愛した人", "自らの手で", "家族"],
    effect: "『娘』がこのキャラに特に反応する",
  },
];
```

### キャラクター断片（共鳴マッチング対象）

`packages/shared/src/domain/character/fragments.ts`:

```typescript
export interface Fragment {
  readonly category: FragmentCategory;
  readonly text: string;
}

// 例: セドの断片
fragments: {
  origin: { category: "origin", text: "灰燼の街の生き残り" },
  loss: { category: "loss", text: "愛した人を自らの手で葬った" },
  // ...
}
```

### ダンジョン層構造

`packages/shared/src/domain/dungeon/types.ts`:

```typescript
export interface DungeonLayer {
  readonly name: string;
  readonly atmosphere: string;
  readonly possibleEvents: readonly string[];
}

export interface DungeonCore {
  readonly nature: CoreNature; // "choice" | "confrontation" | "discovery" | "loss" | "liberation"
  readonly description: string;
  readonly possibleOutcomes: readonly string[];
}
```

### セッションエラー型

`packages/shared/src/types/errors.ts`:

```typescript
export interface SessionNotFoundError extends BaseError {
  readonly code: "SESSION_NOT_FOUND";
  readonly sessionId: string;
}

export interface SessionGenerationError extends BaseError {
  readonly code: "SESSION_GENERATION_ERROR";
  readonly stage: "resonance" | "plot" | "scenes" | "save";
}

// ファクトリ関数
Errors.sessionNotFound(sessionId);
Errors.sessionGeneration("plot", "プロット生成に失敗しました");
```

### tRPCルーターパターン

`apps/api/src/features/character/router.ts`:

```typescript
// protectedProcedure を使用した認証必須エンドポイント
create: protectedProcedure
  .input(createCharacterSchema)
  .mutation(async ({ ctx, input }) => {
    const result = await createCharacter(ctx.user.id, input);
    if (result.isErr()) {
      throw new TRPCError({
        code: mapErrorCode(result.error),
        message: result.error.message,
      });
    }
    return result.value;
  }),
```

### DBスキーマパターン

`apps/api/src/infrastructure/database/schema/characters.ts`:

```typescript
// JSONBカラムの使用パターン
export const characters = pgTable("characters", {
  id: uuid("id").primaryKey(),
  fragments: jsonb("fragments").notNull().$type<CharacterFragmentsRow>(),
  directives: jsonb("directives").notNull().$type<CharacterDirectivesRow>(),
  history: jsonb("history").notNull().$type<HistoryEntryRow[]>().default([]),
  // ...
});
```

### リプレイ形式（docs/design.mdより）

```yaml
# リプレイの構造
replay:
  header:
    dungeonName: "忘却の聖堂"
    dungeonAlias: "神が目を逸らした場所"
    party: [{ name: "灰村のセド", title: "贖いを探す者" }]
    depthReached: 3
    outcomeType: "解放"

  epigraph: "『愛ゆえに堕ちた者を、誰が裁けるというのか』"

  scenes:
    - number: 1
      title: "沈黙の参道"
      text: "苔むした石畳が、灰色の霧の中に沈んでいた..."

  epilogue: "聖堂を出た時、夜が明けていた..."

  footer:
    sessionDate: "薄暮の月、17日"
    survivors: "3/3"
    characterChanges: [...]
```

## 参考

- [セッション生成ロジック](../../docs/design.md#セッション生成ロジック)
- [リプレイ出力形式](../../docs/design.md#リプレイ出力形式)
- [共鳴トリガー](../../docs/design.md#共鳴トリガー)

## 注意事項

- 生成には時間がかかるため、UXに注意（進捗表示必須）
- LLMのレート制限に注意（キュー管理検討）
- 借用キャラの更新は lending 設定を遵守
- 生成結果は必ず保存してから表示（途中離脱対策）

## 依存関係

### 前提タスク

- [x] feature-auth.md
- [x] feature-character-creation.md（LLMサービス）
- [x] feature-seed-data.md（テスト用データ）

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Ready
**前提タスク:** feature-auth.md, feature-character-creation.md
