/**
 * LLMサービス
 *
 * フォールバック機能付きのLLMサービス実装
 * 複数のプロバイダーを順番に試行し、成功するまでリトライする
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type {
  LLMProvider,
  LLMService,
  LLMServiceConfig,
  LLMServiceError,
  BiographyGenerationInput,
  NameGenerationInput,
  LLMApiKeys,
} from "./types";
import {
  createGroqProvider,
  createGeminiProvider,
  createOpenRouterProvider,
} from "./providers";
import {
  BIOGRAPHY_SYSTEM_PROMPT,
  buildBiographyPrompt,
  cleanBiographyResponse,
  NAMES_SYSTEM_PROMPT,
  buildNamesPrompt,
  parseNamesResponse,
} from "./prompts";

// ========================================
// Default Configuration
// ========================================

const DEFAULT_CONFIG: LLMServiceConfig = {
  // OpenRouterを優先（無料モデル利用可能）、Groq/Geminiをフォールバック
  providers: ["openrouter", "groq", "gemini"],
  defaultTimeout: 30000,
  retryCount: 2,
};

// ========================================
// Service Factory
// ========================================

/**
 * LLMサービスを作成
 *
 * @param apiKeys APIキー設定
 * @param config サービス設定（オプション）
 */
export function createLLMService(
  apiKeys: LLMApiKeys,
  config: Partial<LLMServiceConfig> = {},
): LLMService {
  const fullConfig: LLMServiceConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // プロバイダーを初期化
  const providers: Map<string, LLMProvider> = new Map();
  providers.set("openrouter", createOpenRouterProvider(apiKeys.openrouter));
  providers.set("groq", createGroqProvider(apiKeys.groq));
  providers.set("gemini", createGeminiProvider(apiKeys.gemini));

  // 利用可能なプロバイダーを優先順位順に取得
  const getAvailableProviders = (): LLMProvider[] => {
    const available = fullConfig.providers
      .map((name) => providers.get(name))
      .filter((p): p is LLMProvider => p !== undefined && p.isAvailable());

    return available;
  };

  /**
   * フォールバック付きで生成を実行
   */
  const generateWithFallback = (
    prompt: string,
    systemPrompt: string,
  ): ResultAsync<string, LLMServiceError> => {
    const availableProviders = getAvailableProviders();

    if (availableProviders.length === 0) {
      return errAsync(
        Errors.llm("none", "利用可能なLLMプロバイダーがありません"),
      );
    }

    // プロバイダーを順番に試行
    let lastError: LLMServiceError | null = null;

    const tryProvider = (
      index: number,
    ): ResultAsync<string, LLMServiceError> => {
      if (index >= availableProviders.length) {
        return errAsync(
          lastError ?? Errors.llm("none", "全てのプロバイダーで失敗しました"),
        );
      }

      const provider = availableProviders[index];

      return provider
        .generate(prompt, {
          systemPrompt,
          timeout: fullConfig.defaultTimeout,
        })
        .map((result) => result.text)
        .orElse((error) => {
          lastError = error;
          // 次のプロバイダーを試行
          return tryProvider(index + 1);
        });
    };

    return tryProvider(0);
  };

  // ========================================
  // Service Methods
  // ========================================

  const generateBiography = (
    input: BiographyGenerationInput,
  ): ResultAsync<string, LLMServiceError> => {
    const prompt = buildBiographyPrompt(input);

    return generateWithFallback(prompt, BIOGRAPHY_SYSTEM_PROMPT).map(
      cleanBiographyResponse,
    );
  };

  const generateNameSuggestions = (
    input: NameGenerationInput,
  ): ResultAsync<string[], LLMServiceError> => {
    const prompt = buildNamesPrompt(input);

    return generateWithFallback(prompt, NAMES_SYSTEM_PROMPT).andThen((text) => {
      const names = parseNamesResponse(text);

      if (names.length === 0) {
        return errAsync(Errors.llm("parse", "名前候補を抽出できませんでした"));
      }

      return okAsync(names);
    });
  };

  return {
    generateBiography,
    generateNameSuggestions,
  };
}

// ========================================
// Factory (for Hono context)
// ========================================

/**
 * LLMサービスを取得
 *
 * 注意: Cloudflare Workersはリクエストごとに新しいコンテキストで実行されるため、
 * 毎回新しいインスタンスを生成する
 *
 * @param apiKeys LLM APIキー設定
 */
export function getLLMService(apiKeys: LLMApiKeys): LLMService {
  return createLLMService(apiKeys);
}
