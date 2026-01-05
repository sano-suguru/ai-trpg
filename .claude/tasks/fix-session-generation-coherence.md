# タスク: セッション生成パイプラインの整合性とレート制限対策の改善

## 概要

セッション生成パイプラインにおいて、各ステップ間の情報引き継ぎ不足による整合性問題と、LLMプロバイダーのレート制限対策欠如を解決する。

## 背景

現在のセッション生成では以下の問題が発生している:

1. **整合性の問題**: 生成されたセッションの各ステップ（プロット→シーン→エピローグ）で内容の一貫性がない
2. **レート制限エラー**: 複数のLLM呼び出しを連続実行するため、レート制限に引っかかりやすい

### 根本原因の分析

#### 情報引き継ぎの現状

| ステップ | 渡されている情報 | 欠落している情報 |
|---------|----------------|-----------------|
| プロット生成 | パーティ全情報、ダンジョン全情報、共鳴イベント | ✅ 十分 |
| エピグラフ生成 | ダンジョン名/ロア、結末タイプ | パーティ情報、プロット詳細 |
| シーン生成 | シーン概要、前シーン末尾300文字、プロット概要3行 | **キャラクター断片・行動指針** |
| エピローグ生成 | プロット、全シーン末尾500文字 | パーティ情報 |

#### 最大の問題点

`services/generation/prompts/scene.ts:79-82` で確認:
```typescript
// プロット概要しか渡していない
parts.push(`## プロット概要
オープニング: ${plot.opening.hook}
クライマックス: ${plot.climax.confrontation}
結末: ${plot.resolution.outcome}`);
```

**シーン生成時にキャラクターの断片・行動指針が一切渡されていない。** LLMはキャラクター名だけ知っていて、そのキャラクターがどんな人物かを知らないまま執筆している。

#### レート制限対策の現状

- 全プロバイダー: レート制限エラーの**検出**はある
- しかし**リトライ・ディレイ・ジッター**は実装されていない
- シーン生成（5-8回のLLM呼び出し）: ディレイなしで連続呼び出し

## 要件

### 機能要件

#### 高優先度: 整合性改善

- [ ] シーン生成時にキャラクター情報（断片・行動指針）をプロンプトに含める
- [ ] 前シーンの文脈量を増やす（300文字→600-800文字）
- [ ] プロット情報をより詳細に渡す（シーン一覧の概要を含める）

#### 中優先度: レート制限対策

- [ ] シーン生成間にディレイを追加（500-1000ms + ジッター±200ms）
- [ ] レート制限エラー時のExponential backoffリトライ（1s→2s→4s、最大3回）

#### 低優先度: 文字数検証の緩和

- [ ] 最小文字数を緩和（300→150）またはエラーではなく警告に変更
- [ ] 短すぎる場合のリトライオプション（「もう少し詳しく」をプロンプトに追加）

### 非機能要件

- [ ] 既存のテストが引き続きパスすること
- [ ] 生成時間の増加を最小限に抑える（ディレイ追加による増加は許容）

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
|-----------|---------|---------|
| `api` | `services/generation/prompts/scene.ts` | シーン生成プロンプトにキャラクター情報追加 |
| `api` | `services/generation/scene.ts` | SceneGenerationInput型変更、ディレイ追加、文字数検証緩和 |
| `api` | `services/generation/pipeline.ts` | シーン生成呼び出しにパーティ情報を渡す |
| `api` | `services/llm/providers/groq.ts` | リトライロジック追加 |
| `api` | `services/llm/providers/gemini.ts` | リトライロジック追加 |
| `api` | `services/llm/providers/openrouter.ts` | リトライロジック追加 |
| `api` | `services/llm/types.ts` | リトライ設定の型追加（オプション） |

### プロンプト改善案

#### シーン生成プロンプトへの追加情報

```typescript
// 追加: パーティ情報
parts.push(`## パーティメンバー
${party.map(char => `
【${char.name}】（${char.title}）
出自: ${char.fragments.origin.text}
喪失: ${char.fragments.loss.text}
刻印: ${char.fragments.mark.text}
行動指針:
  危険時: ${char.directives.danger}
  仲間の窮地: ${char.directives.allyInPeril}
`).join('\n')}`);

// 改善: 前シーンの文脈量増加
if (previousSceneText) {
  parts.push(`## 前シーン
${previousSceneText.slice(-700)}...`);  // 300 → 700
}

// 改善: これまでのシーン概要
parts.push(`## これまでの流れ
${previousScenes.map(s => `シーン${s.number}: ${s.title}`).join('\n')}`);
```

### リトライ/ディレイ設計

```typescript
// ディレイユーティリティ
async function delayWithJitter(baseMs: number, jitterMs: number): Promise<void> {
  const jitter = Math.random() * jitterMs * 2 - jitterMs;
  await new Promise(resolve => setTimeout(resolve, baseMs + jitter));
}

// Exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (isRateLimitError(error)) {
        const delay = initialDelayMs * Math.pow(2, i);
        await delayWithJitter(delay, delay * 0.2);
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
```

### 型変更

```typescript
// SceneGenerationInput に追加
export interface SceneGenerationInput {
  // 既存フィールド...

  /** パーティ情報（キャラクター詳細） */
  readonly party: readonly Character[];
  /** これまでに生成されたシーンの概要 */
  readonly previousSceneSummaries: readonly { number: number; title: string }[];
}
```

## 実装手順

### Phase 1: 整合性改善（高優先度）

1. [ ] `SceneGenerationInput` に `party` と `previousSceneSummaries` フィールド追加
2. [ ] `buildScenePrompt` にキャラクター情報セクション追加
3. [ ] 前シーンの文脈量を300→700文字に増加
4. [ ] これまでのシーン概要をプロンプトに追加
5. [ ] `generateAllScenes` でパーティ情報を渡すように変更
6. [ ] `pipeline.ts` の呼び出しを更新

### Phase 2: レート制限対策（中優先度）

7. [ ] `services/llm/utils/retry.ts` にリトライユーティリティ作成
8. [ ] `services/llm/utils/delay.ts` にディレイユーティリティ作成
9. [ ] 各プロバイダーにリトライロジック追加（オプショナル）
10. [ ] `generateAllScenes` にシーン間ディレイ追加

### Phase 3: 文字数検証の緩和（低優先度）

11. [ ] `MIN_SCENE_LENGTH` を300→150に変更
12. [ ] 短い場合のリトライオプション追加（オプショナル）

### Phase 4: 検証

13. [ ] 既存のモックテストがパスすることを確認
14. [ ] 手動で生成を実行し、整合性が改善されたことを確認

## テスト計画

- [ ] ユニットテスト: `buildScenePrompt` がキャラクター情報を含むことを確認
- [ ] ユニットテスト: `delayWithJitter` の動作確認
- [ ] ユニットテスト: `withRetry` のExponential backoff確認
- [ ] 統合テスト: モックプロバイダーでパイプライン全体が動作することを確認
- [ ] 手動テスト: 実際のLLMで生成し、キャラクターらしい発言・行動があるか確認

## 完了条件

- [ ] シーン生成プロンプトにキャラクター断片・行動指針が含まれている
- [ ] 前シーンの文脈が700文字程度渡されている
- [ ] シーン間に500-1000msのディレイがある
- [ ] レート制限時にExponential backoffでリトライされる
- [ ] `pnpm lint` がパス
- [ ] `pnpm typecheck` がパス
- [ ] 既存テストがパス

## 関連ファイル

- [pipeline.ts](../../apps/api/src/services/generation/pipeline.ts) - パイプライン本体
- [scene.ts](../../apps/api/src/services/generation/scene.ts) - シーン生成
- [prompts/scene.ts](../../apps/api/src/services/generation/prompts/scene.ts) - シーンプロンプト
- [prompts/plot.ts](../../apps/api/src/services/generation/prompts/plot.ts) - プロットプロンプト（参考）
- [providers/groq.ts](../../apps/api/src/services/llm/providers/groq.ts) - Groqプロバイダー

## 備考

### キャラクター情報の構造（参考）

```typescript
interface CharacterFragments {
  readonly origin: OriginFragment;   // 出自
  readonly loss: LossFragment;       // 喪失
  readonly mark: MarkFragment;       // 刻印
  readonly sin: SinFragment | null;  // 業（任意）
  readonly quest: QuestFragment | null;  // 探求（任意）
  readonly trait: TraitFragment | null;  // 癖/性向（任意）
}

interface CharacterDirectives {
  readonly danger: DangerDirective;           // 危険時
  readonly allyInPeril: AllyInPerilDirective; // 仲間の窮地
  readonly moralChoice: MoralChoiceDirective; // 道徳的選択
  readonly unknown: UnknownDirective;         // 未知との遭遇
}
```

### 現在のLLM呼び出し回数

1回のセッション生成で:
- プロット生成: 1回
- エピグラフ生成: 1回
- シーン生成: 5-8回（シーン数による）
- エピローグ生成: 1回
- **合計: 8-11回**

---

**作成日:** 2026-01-05
**担当:** Claude
**ステータス:** Ready
