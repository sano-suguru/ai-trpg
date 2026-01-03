/**
 * Groqプロバイダー
 *
 * Groq API（高速推論）を使用したLLMプロバイダー実装
 * Cloudflare AI Gateway経由でアクセス（必須）
 *
 * NOTE: Cloudflare WorkersからGroq APIへの直接アクセスは
 * Groqのセキュリティポリシーによりブロックされるため、
 * AI Gateway経由でのアクセスが必須
 */

// Cloudflare Workers環境でweb fetch APIを使用
import "groq-sdk/shims/web";
import Groq from "groq-sdk";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
  LLMServiceError,
  AIGatewayConfig,
} from "../types";

// ========================================
// Constants
// ========================================

const PROVIDER_NAME = "groq" as const;
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TIMEOUT = 30000;

// ========================================
// Types
// ========================================

export interface GroqProviderConfig {
  /** Groq APIキー */
  readonly apiKey?: string;
  /** Cloudflare AI Gateway設定（必須） */
  readonly aiGateway: AIGatewayConfig;
}

// ========================================
// Provider Implementation
// ========================================

/**
 * AI Gateway経由のbaseURLを生成
 *
 * NOTE: AIGatewayConfigはcontext.tsで検証済みのため、ここでは信頼して使用
 */
function buildBaseURL(config: AIGatewayConfig): string {
  const { accountId, gatewayId } = config;
  return `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/groq`;
}

/**
 * Groqプロバイダーを作成
 *
 * @param config プロバイダー設定（APIキーとAI Gateway設定）
 */
export function createGroqProvider(config: GroqProviderConfig): LLMProvider {
  const { apiKey, aiGateway } = config;
  const baseURL = buildBaseURL(aiGateway);

  const client = apiKey
    ? new Groq({
        apiKey,
        baseURL,
      })
    : null;

  const isAvailable = (): boolean => {
    return !!client;
  };

  const generate = (
    prompt: string,
    options?: GenerateOptions,
  ): ResultAsync<GenerateResult, LLMServiceError> => {
    if (!client) {
      return errAsync(
        Errors.llm(PROVIDER_NAME, "Groq APIキーが設定されていません"),
      );
    }

    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
    const systemPrompt = options?.systemPrompt;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    return ResultAsync.fromPromise(
      client.chat.completions.create(
        {
          model: DEFAULT_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        {
          timeout: options?.timeout ?? DEFAULT_TIMEOUT,
        },
      ),
      (error): LLMServiceError => {
        // レート制限エラーの判定
        if (error instanceof Groq.RateLimitError) {
          return Errors.llmRateLimit(PROVIDER_NAME);
        }
        // その他のエラー
        const message =
          error instanceof Error ? error.message : "不明なエラーが発生しました";
        return Errors.llm(PROVIDER_NAME, message);
      },
    ).andThen((response) => {
      const content = response.choices[0]?.message?.content;

      if (!content) {
        return errAsync(Errors.llm(PROVIDER_NAME, "生成結果が空です"));
      }

      const result: GenerateResult = {
        text: content,
        provider: PROVIDER_NAME,
        tokens: response.usage
          ? {
              prompt: response.usage.prompt_tokens,
              completion: response.usage.completion_tokens,
              total: response.usage.total_tokens,
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
