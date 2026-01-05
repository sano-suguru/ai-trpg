/**
 * LLMプロバイダーバレルエクスポート
 */

import { createLogger } from "../../logger";
import type { LLMProvider, AIGatewayConfig } from "../types";
import { createGroqProvider, type GroqProviderConfig } from "./groq";
import { createGeminiProvider } from "./gemini";
import { createOpenRouterProvider } from "./openrouter";

export { createGroqProvider } from "./groq";
export { createGeminiProvider } from "./gemini";
export { createOpenRouterProvider } from "./openrouter";
export { createMockProvider } from "./mock";

const logger = createLogger("LLM:ProviderSelector");

// ========================================
// Provider Selection (Fallback Strategy)
// ========================================

/**
 * プロバイダー選択の設定
 */
export interface ProviderSelectionConfig {
  /** Groq APIキー */
  readonly groqApiKey?: string;
  /** OpenRouter APIキー */
  readonly openrouterApiKey?: string;
  /** Gemini APIキー */
  readonly geminiApiKey?: string;
  /** Cloudflare AI Gateway設定（Groq使用時に必須） */
  readonly aiGateway: AIGatewayConfig;
}

/**
 * フォールバック戦略でLLMプロバイダーを選択
 *
 * 優先順位: Groq → OpenRouter → Gemini
 *
 * @param config プロバイダー設定（APIキー等）
 * @returns 利用可能なプロバイダー、または null（全て利用不可の場合）
 */
export function selectAvailableProvider(
  config: ProviderSelectionConfig,
): LLMProvider | null {
  // 優先順位1: Groq（高速推論）
  const groqConfig: GroqProviderConfig = {
    apiKey: config.groqApiKey,
    aiGateway: config.aiGateway,
  };
  const groqProvider = createGroqProvider(groqConfig);
  if (groqProvider.isAvailable()) {
    logger.info("Selected provider", { provider: "groq" });
    return groqProvider;
  }

  // 優先順位2: OpenRouter（無料モデル対応）
  const openrouterProvider = createOpenRouterProvider(config.openrouterApiKey);
  if (openrouterProvider.isAvailable()) {
    logger.info("Selected provider", { provider: "openrouter" });
    return openrouterProvider;
  }

  // 優先順位3: Gemini（長コンテキスト対応）
  const geminiProvider = createGeminiProvider(config.geminiApiKey);
  if (geminiProvider.isAvailable()) {
    logger.info("Selected provider", { provider: "gemini" });
    return geminiProvider;
  }

  // 全て利用不可
  logger.error("No available LLM provider");
  return null;
}
