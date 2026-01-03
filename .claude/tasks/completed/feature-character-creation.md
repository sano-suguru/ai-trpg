# タスク: キャラクター作成UI + LLM統合

## 概要

断片選択ウィザードとAI生成による人物像作成機能を実装し、ユーザーが自分のキャラクターを作成できるようにする。

## 背景

- MVPの核心機能の一つ
- 「断片を選んでAIに育ててもらう」というゲームの独自性を体現
- 認証基盤が完成していることが前提
- LLMプロバイダー抽象化層の初実装

## 要件

### 機能要件

- [x] 断片選択ステップ
  - [x] 各カテゴリ（出自/喪失/刻印/業/探求/癖）から断片を表示
  - [x] 必須断片（出自/喪失/刻印）を選択
  - [x] 任意断片（業/探求/癖）を選択（0-1個ずつ）
  - [x] 「全部振り直す」ボタンで新しい候補を表示

- [x] AI生成ステップ
  - [x] 選択した断片からAIが「人物像」を生成
  - [x] 生成中のローディング表示
  - [x] 生成結果のプレビュー
  - [x] 「再生成」「承認」「修正指示」ボタン

- [x] 名前・行動指針ステップ
  - [x] 名前入力（自由入力 or AI提案）
  - [x] 行動指針を各場面（4つ）で選択
  - [x] 口調サンプル入力（任意）

- [x] 確認・保存ステップ
  - [x] 完成したキャラシートのプレビュー
  - [x] 公開設定（借用可否）選択
  - [x] 保存ボタン

- [x] 保存後、詳細ページへリダイレクト

### 非機能要件

- [x] LLM生成は3-5秒以内に完了
- [x] 生成失敗時はフォールバックプロバイダーを使用
- [x] エラー時はユーザーフレンドリーなメッセージを表示

## 設計

### 影響範囲

| パッケージ | ファイル                           | 変更内容                 |
| ---------- | ---------------------------------- | ------------------------ |
| `shared`   | `constants/fragments.ts`           | 断片マスターデータ       |
| `shared`   | `constants/directives.ts`          | 行動指針マスターデータ   |
| `api`      | `src/services/llm/`                | LLMサービス層            |
| `api`      | `src/services/llm/providers/`      | 各プロバイダー実装       |
| `api`      | `src/services/llm/prompts/`        | プロンプトテンプレート   |
| `api`      | `src/features/character/router.ts` | 生成エンドポイント追加   |
| `web`      | `src/routes/characters.new.tsx`    | 作成ページ               |
| `web`      | `src/components/character/wizard/` | ウィザードコンポーネント |
| `web`      | `src/stores/characterCreation.ts`  | 作成状態管理             |

### LLMサービス設計

```typescript
// LLMプロバイダーインターフェース
interface LLMProvider {
  readonly name: string;
  generate(
    prompt: string,
    options?: GenerateOptions,
  ): ResultAsync<string, LLMError>;
}

// LLMサービス（フォールバック付き）
interface LLMService {
  generateBiography(
    fragments: CharacterFragments,
  ): ResultAsync<string, LLMError>;
  generateNameSuggestions(
    fragments: CharacterFragments,
  ): ResultAsync<string[], LLMError>;
}

// プロバイダー優先順位
// 1. Groq (高速、無料枠大)
// 2. Gemini (フォールバック)
// 3. GitHub Models (最終手段)
```

### API

| エンドポイント                | メソッド | 認証 | 説明                     |
| ----------------------------- | -------- | ---- | ------------------------ |
| `character.generateBiography` | Mutation | 要   | 断片から人物像を生成     |
| `character.generateNames`     | Mutation | 要   | 名前候補を生成           |
| `character.create`            | Mutation | 要   | キャラクター保存（既存） |
| `fragments.list`              | Query    | 不要 | 断片一覧取得             |
| `directives.list`             | Query    | 不要 | 行動指針一覧取得         |

### ウィザードステップ

```
Step 1: 断片選択
├── 必須断片（出自/喪失/刻印）
└── 任意断片（業/探求/癖）
    ↓
Step 2: AI生成
├── 生成実行
├── 結果プレビュー
└── 承認 or 再生成
    ↓
Step 3: 名前・行動指針
├── 名前入力
├── 行動指針選択（4場面）
└── 口調サンプル（任意）
    ↓
Step 4: 確認・保存
├── キャラシートプレビュー
├── 公開設定
└── 保存
```

### 状態管理（Zustand）

```typescript
interface CharacterCreationStore {
  // 現在のステップ
  step: 1 | 2 | 3 | 4;

  // Step 1: 断片
  fragments: Partial<CharacterFragments>;

  // Step 2: 生成結果
  biography: string | null;
  isGenerating: boolean;

  // Step 3: 詳細
  name: string;
  directives: CharacterDirectives;
  voiceSamples: VoiceSample[];

  // Step 4: 設定
  lending: LendingSetting;
  isPublic: boolean;

  // アクション
  setFragment(type: FragmentType, value: string): void;
  nextStep(): void;
  prevStep(): void;
  reset(): void;
}
```

## 実装手順

### Phase 1: マスターデータ

1. [x] 断片マスターデータ作成
   - `shared/constants/fragments.ts`
   - docs/design.mdの断片例を全てデータ化

2. [x] 行動指針マスターデータ作成
   - `shared/constants/directives.ts`
   - 4場面 × 選択肢

3. [x] 取得API作成
   - `api/features/fragment/router.ts`
   - `api/features/directive/router.ts`

### Phase 2: LLMサービス

4. [x] LLMプロバイダーインターフェース
   - `api/src/services/llm/types.ts`

5. [x] Groqプロバイダー実装
   - `api/src/services/llm/providers/groq.ts`

6. [x] Geminiプロバイダー実装
   - `api/src/services/llm/providers/gemini.ts`

7. [x] LLMサービス実装（フォールバック付き）
   - `api/src/services/llm/service.ts`

8. [x] プロンプトテンプレート
   - `api/src/services/llm/prompts/biography.ts`
   - `api/src/services/llm/prompts/names.ts`

9. [x] 生成APIエンドポイント
   - `character.generateBiography`
   - `character.generateNames`

### Phase 3: フロントエンドウィザード

10. [x] 状態管理ストア
    - `web/src/stores/characterCreation.ts`

11. [x] ウィザードコンポーネント
    - `web/src/components/character/wizard/FragmentStep.tsx`
    - `web/src/components/character/wizard/BiographyStep.tsx`
    - `web/src/components/character/wizard/NameDirectivesStep.tsx`
    - `web/src/components/character/wizard/ConfirmStep.tsx`

12. [x] 作成ページ
    - `web/src/routes/characters/new.tsx`

13. [x] ナビゲーション追加
    - ヘッダーに「キャラ作成」ボタン

### Phase 4: 統合・テスト

14. [x] 全フロー動作確認

15. [x] `pnpm lint -- --fix` 実行

16. [x] `pnpm typecheck` 実行

## テスト計画

- [x] 断片選択が正しく動作する
- [x] AI生成が正常に完了する
- [x] フォールバックが機能する（プライマリ失敗時）
- [x] キャラクターが保存される
- [x] 保存後に詳細ページに遷移する
- [x] 未認証では作成ページにアクセスできない

## 完了条件

- [x] 全ての要件が実装されている
- [x] `pnpm lint` がパス（警告なし）
- [x] `pnpm typecheck` がパス
- [x] キャラクター作成フロー全体が動作する
- [x] LLM生成が成功する

## 既存コード参照

### 断片の型定義

`packages/shared/src/domain/character/fragments.ts`:

```typescript
// 断片カテゴリ
export const FragmentCategories = {
  ORIGIN: "origin", // 出自（必須）
  LOSS: "loss", // 喪失（必須）
  MARK: "mark", // 刻印（必須）
  SIN: "sin", // 業（任意）
  QUEST: "quest", // 探求（任意）
  TRAIT: "trait", // 癖/性向（任意）
} as const;

export interface CharacterFragments {
  readonly origin: Fragment; // 必須
  readonly loss: Fragment; // 必須
  readonly mark: Fragment; // 必須
  readonly sin: Fragment | null; // 任意
  readonly quest: Fragment | null; // 任意
  readonly trait: Fragment | null; // 任意
}
```

### 行動指針の型定義

`packages/shared/src/domain/character/directives.ts`:

```typescript
export const DirectiveSituations = {
  DANGER: "danger", // 危険を前にしたとき
  ALLY_IN_PERIL: "ally_in_peril", // 仲間が窮地に陥ったとき
  MORAL_CHOICE: "moral_choice", // 道徳的選択を迫られたとき
  UNKNOWN: "unknown", // 未知のものに遭遇したとき
} as const;

export interface CharacterDirectives {
  readonly danger: DirectiveValue;
  readonly allyInPeril: DirectiveValue;
  readonly moralChoice: DirectiveValue;
  readonly unknown: DirectiveValue;
}
```

### キャラクター作成API

`apps/api/src/features/character/router.ts`:

```typescript
// create は protectedProcedure（認証必須）
create: protectedProcedure
  .input(createCharacterSchema)
  .mutation(async ({ ctx, input }) => {
    const result = await createCharacter(ctx.user.id, input);
    // ...
  }),
```

### Zodスキーマ

`packages/shared/src/schemas/character.ts`:

```typescript
export const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  title: z.string().max(100).optional(),
  fragments: fragmentsSchema,
  directives: directivesSchema,
  biography: z.string().max(2000),
  voiceSamples: z.array(voiceSampleSchema).optional(),
  lending: lendingSettingSchema.optional().default("safe"),
  isPublic: z.boolean().optional().default(true),
});
```

### エラーハンドリングパターン

`packages/shared/src/lib/result.ts`:

```typescript
// LLM呼び出しのエラーハンドリング
const result = await wrapExternalCall(llmProvider.generate(prompt), "Groq");

if (result.isErr()) {
  // フォールバックプロバイダーを試行
  return await wrapExternalCall(fallbackProvider.generate(prompt), "Gemini");
}
```

### 既存LLMエラー型

`packages/shared/src/types/errors.ts`:

```typescript
export interface LLMError extends BaseError {
  readonly code: "LLM_ERROR";
  readonly provider: string;
}

export interface LLMRateLimitError extends BaseError {
  readonly code: "LLM_RATE_LIMIT";
  readonly provider: string;
  readonly retryAfter?: number;
}

// ファクトリ関数
Errors.llm("Groq", "生成に失敗しました");
Errors.llmRateLimit("Groq", 60);
```

## 参考

- [キャラクター作成フロー](../../docs/design.md#キャラクター作成フロー)
- [断片カテゴリ](../../docs/design.md#断片カテゴリ)
- [行動指針](../../docs/design.md#行動指針)
- [LLM統合設計](../../docs/architecture.md#llm統合設計)

## 注意事項

- LLM APIキーは環境変数で管理（コミットしない）
- 生成結果は必ずユーザー承認を経る（自動保存しない）
- レート制限に注意（フォールバック実装必須）
- 生成プロンプトは日本語で、世界観を意識

## 依存関係

### 前提タスク

- [x] feature-auth.md（認証基盤）

### 新規パッケージ

```bash
# API
pnpm --filter @ai-trpg/api add @google/generative-ai groq-sdk

# または OpenRouter経由で複数プロバイダーを統一
pnpm --filter @ai-trpg/api add openai  # OpenRouter互換
```

---

**作成日:** 2026-01-01
**担当:** Claude
**ステータス:** Completed
**前提タスク:** feature-auth.md
