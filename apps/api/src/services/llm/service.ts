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
  AIGatewayConfig,
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

/**
 * デフォルト設定
 *
 * プロバイダー追加時の変更箇所:
 * 1. types.ts - LLMProviderName に追加
 * 2. types.ts - LLMApiKeys にキー追加
 * 3. ここの providers 配列に追加（優先順位順）
 * 4. createLLMService 内の providers.set() でインスタンス登録
 */
const DEFAULT_CONFIG: LLMServiceConfig = {
  // 優先順位（左から順に試行、最初に成功したものを使用）
  providers: ["groq", "openrouter", "gemini"],
  defaultTimeout: 30000,
  retryCount: 2,
};

// ========================================
// Service Factory
// ========================================

/**
 * LLMサービス作成オプション
 */
export interface CreateLLMServiceOptions {
  /** APIキー設定 */
  readonly apiKeys: LLMApiKeys;
  /** サービス設定（オプション） */
  readonly config?: Partial<LLMServiceConfig>;
  /** Cloudflare AI Gateway設定（Groqアクセスに必須） */
  readonly aiGateway: AIGatewayConfig;
}

/**
 * LLMサービスを作成
 *
 * @param options サービス作成オプション
 */
export function createLLMService(options: CreateLLMServiceOptions): LLMService {
  const { apiKeys, config = {}, aiGateway } = options;

  const fullConfig: LLMServiceConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // プロバイダーを初期化
  // NOTE: AI GatewayはGroqのみ対応。理由:
  // - Groqが高速推論で主力プロバイダーのため優先的に対応
  // - Gemini/OpenRouterは各SDKのbaseURL変更サポート状況の調査が必要
  // - 必要に応じて将来拡張可能（各プロバイダーのconfigにaiGatewayを追加）
  const providers: Map<string, LLMProvider> = new Map();
  providers.set("openrouter", createOpenRouterProvider(apiKeys.openrouter));
  providers.set(
    "groq",
    createGroqProvider({
      apiKey: apiKeys.groq,
      aiGateway,
    }),
  );
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
    const tryProvider = (
      index: number,
    ): ResultAsync<string, LLMServiceError> => {
      if (index >= availableProviders.length) {
        // TODO: 構造化ログ導入後、最後のエラー詳細をログに記録する
        // See: .claude/tasks/infra-structured-logging.md
        // セキュリティ: プロバイダー固有のエラー詳細（APIキー、内部URL等）を
        // クライアントに露出させないため、一般的なメッセージのみ返す
        return errAsync(Errors.llm("none", "全てのプロバイダーで失敗しました"));
      }

      const provider = availableProviders[index];

      return provider
        .generate(prompt, {
          systemPrompt,
          timeout: fullConfig.defaultTimeout,
        })
        .map((result) => result.text)
        .orElse(() => {
          // TODO: 構造化ログ導入後、errorの詳細をログに記録する
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
 * @param options サービス作成オプション
 */
export function getLLMService(options: CreateLLMServiceOptions): LLMService {
  return createLLMService(options);
}
