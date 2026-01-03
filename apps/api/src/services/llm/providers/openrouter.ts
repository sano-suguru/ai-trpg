/**
 * OpenRouterプロバイダー
 *
 * OpenRouter API（統合LLMゲートウェイ）を使用したLLMプロバイダー実装
 * 無料モデル（DeepSeek等）を含む300以上のモデルにアクセス可能
 */

import { OpenRouter } from "@openrouter/sdk";
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

const PROVIDER_NAME = "openrouter" as const;
// DeepSeek V3は無料で高品質な日本語対応モデル
const DEFAULT_MODEL = "deepseek/deepseek-chat";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TIMEOUT = 30000;

// ========================================
// Provider Implementation
// ========================================

/**
 * OpenRouterプロバイダーを作成
 *
 * @param apiKey OpenRouter APIキー
 */
export function createOpenRouterProvider(apiKey?: string): LLMProvider {
  const client = apiKey
    ? new OpenRouter({
        apiKey,
      })
    : null;

  const isAvailable = (): boolean => {
    return !!client && !!apiKey;
  };

  const generate = (
    prompt: string,
    options?: GenerateOptions,
  ): ResultAsync<GenerateResult, LLMServiceError> => {
    if (!client) {
      return errAsync(
        Errors.llm(PROVIDER_NAME, "OpenRouter APIキーが設定されていません"),
      );
    }

    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
    const systemPrompt = options?.systemPrompt;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    return ResultAsync.fromPromise(
      client.chat.send(
        {
          model: DEFAULT_MODEL,
          messages,
          maxTokens,
          temperature,
        },
        {
          // SDKのtimeoutMsオプションを使用（内部でAbortControllerを管理）
          timeoutMs: timeout,
        },
      ),
      (error): LLMServiceError => {
        const message =
          error instanceof Error ? error.message : "不明なエラーが発生しました";

        // レート制限エラーの判定
        if (message.includes("429") || message.includes("rate limit")) {
          return Errors.llmRateLimit(PROVIDER_NAME);
        }

        return Errors.llm(PROVIDER_NAME, message);
      },
    ).andThen((response) => {
      const messageContent = response.choices?.[0]?.message?.content;

      // contentは文字列または配列の可能性がある
      const content =
        typeof messageContent === "string"
          ? messageContent
          : Array.isArray(messageContent)
            ? messageContent
                .filter(
                  (item): item is { type: "text"; text: string } =>
                    item.type === "text",
                )
                .map((item) => item.text)
                .join("")
            : null;

      if (!content) {
        return errAsync(Errors.llm(PROVIDER_NAME, "生成結果が空です"));
      }

      const result: GenerateResult = {
        text: content,
        provider: PROVIDER_NAME,
        tokens: response.usage
          ? {
              prompt: response.usage.promptTokens ?? 0,
              completion: response.usage.completionTokens ?? 0,
              total: response.usage.totalTokens ?? 0,
            }
          : undefined,
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
