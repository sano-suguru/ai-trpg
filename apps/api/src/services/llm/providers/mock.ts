/**
 * モックLLMプロバイダー
 *
 * E2Eテスト用の固定レスポンスを返すプロバイダー
 * 環境変数 USE_MOCK_LLM=true で有効化
 */

import { okAsync } from "neverthrow";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../types";

// ========================================
// Constants
// ========================================

const PROVIDER_NAME = "mock" as const;

/**
 * モックレスポンス
 *
 * 実際のLLMが生成するような自然な文章を固定で返す
 */
const MOCK_RESPONSES = {
  biography: `灰の時代に生まれ、かつて栄華を誇った故郷が一夜にして炎に包まれるのを目撃した。
逃げ惑う人々の中で、愛する者を救えなかった記憶が今も胸を焼く。
白髪はあの夜に変わり、焦げた指先は決して癒えない傷として残る。
それでも前を向き、同じ悲劇を繰り返させまいと旅を続けている。`,

  names: `1. 灰燼のセド
2. 忘却のリラ
3. 灰色のヴォルク`,
} as const;

// ========================================
// Provider Implementation
// ========================================

/**
 * モックプロバイダーを作成
 *
 * E2Eテストで使用する固定レスポンスを返すプロバイダー
 * - 即座にレスポンスを返す（ネットワーク遅延なし）
 * - 常に成功する（エラーシミュレーションなし）
 */
export function createMockProvider(): LLMProvider {
  const isAvailable = (): boolean => {
    // モックは常に利用可能
    return true;
  };

  const generate = (
    _prompt: string,
    options?: GenerateOptions,
  ): ReturnType<LLMProvider["generate"]> => {
    // システムプロンプトの内容で経歴生成か名前生成かを判定
    const isBiographyGeneration =
      options?.systemPrompt?.includes("人物像") ?? false;

    const text = isBiographyGeneration
      ? MOCK_RESPONSES.biography
      : MOCK_RESPONSES.names;

    const result: GenerateResult = {
      text,
      provider: PROVIDER_NAME,
      tokens: {
        prompt: 100,
        completion: 50,
        total: 150,
      },
    };

    return okAsync(result);
  };

  return {
    name: PROVIDER_NAME,
    generate,
    isAvailable,
  };
}
