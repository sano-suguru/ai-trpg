/**
 * Geminiプロバイダー
 *
 * Google Generative AI（Gemini）を使用したLLMプロバイダー実装
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
  LLMServiceError,
} from "../types";

// ========================================
// Constants
// ========================================

const PROVIDER_NAME = "gemini" as const;
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TIMEOUT = 30000;

// ========================================
// Safety Settings
// ========================================

/**
 * Geminiの安全設定
 * ゲーム内の暴力描写等を許容するため、ブロック閾値を調整
 */
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// ========================================
// Provider Implementation
// ========================================

/**
 * Geminiプロバイダーを作成
 *
 * @param apiKey Gemini APIキー
 */
export function createGeminiProvider(apiKey?: string): LLMProvider {
  const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  const isAvailable = (): boolean => {
    return !!client && !!apiKey;
  };

  const generate = (
    prompt: string,
    options?: GenerateOptions,
  ): ResultAsync<GenerateResult, LLMServiceError> => {
    if (!client) {
      return errAsync(
        Errors.llm(PROVIDER_NAME, "Gemini APIキーが設定されていません"),
      );
    }

    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
    const systemPrompt = options?.systemPrompt;

    const model = client.getGenerativeModel({
      model: DEFAULT_MODEL,
      safetySettings,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    });

    // システムプロンプトがある場合は先頭に追加
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n---\n\n${prompt}`
      : prompt;

    // タイムアウト設定（SDKのtimeoutオプションを使用）
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    return ResultAsync.fromPromise(
      model.generateContent(fullPrompt, { timeout }),
      (error): LLMServiceError => {
        const message =
          error instanceof Error ? error.message : "不明なエラーが発生しました";

        // レート制限エラーの判定（Geminiの429エラー）
        if (message.includes("429") || message.includes("rate limit")) {
          return Errors.llmRateLimit(PROVIDER_NAME);
        }

        return Errors.llm(PROVIDER_NAME, message);
      },
    ).andThen((response) => {
      const text = response.response.text();

      if (!text) {
        return errAsync(Errors.llm(PROVIDER_NAME, "生成結果が空です"));
      }

      const result: GenerateResult = {
        text,
        provider: PROVIDER_NAME,
        // Geminiは使用トークン情報を直接提供しないため省略
      };

      return okAsync(result);
    });
  };

  return {
    name: PROVIDER_NAME,
    generate,
    isAvailable,
  };
}
