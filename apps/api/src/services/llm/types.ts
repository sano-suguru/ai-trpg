/**
 * LLMサービス型定義
 *
 * 複数のLLMプロバイダーを抽象化するための型定義
 */

import type { ResultAsync } from "neverthrow";
import type { LLMError, LLMRateLimitError } from "@ai-trpg/shared/types";

// ========================================
// Provider Types
// ========================================

/**
 * サポートするLLMプロバイダー
 */
export type LLMProviderName = "groq" | "gemini" | "github" | "openrouter";

/**
 * 生成オプション
 */
export interface GenerateOptions {
  /** 生成する最大トークン数 */
  readonly maxTokens?: number;
  /** 温度パラメータ（創造性の度合い） */
  readonly temperature?: number;
  /** システムプロンプト */
  readonly systemPrompt?: string;
  /** タイムアウト（ミリ秒） */
  readonly timeout?: number;
}

/**
 * 生成結果
 */
export interface GenerateResult {
  /** 生成されたテキスト */
  readonly text: string;
  /** 使用したプロバイダー */
  readonly provider: LLMProviderName;
  /** 使用したトークン数（取得可能な場合） */
  readonly tokens?: {
    readonly prompt: number;
    readonly completion: number;
    readonly total: number;
  };
}

/**
 * LLM関連エラー
 */
export type LLMServiceError = LLMError | LLMRateLimitError;

// ========================================
// Provider Interface
// ========================================

/**
 * LLMプロバイダーインターフェース
 *
 * 各プロバイダー実装が準拠する共通インターフェース
 */
export interface LLMProvider {
  /** プロバイダー名 */
  readonly name: LLMProviderName;

  /**
   * テキストを生成
   *
   * @param prompt ユーザープロンプト
   * @param options 生成オプション
   * @returns 生成結果またはエラー
   */
  generate(
    prompt: string,
    options?: GenerateOptions,
  ): ResultAsync<GenerateResult, LLMServiceError>;

  /**
   * プロバイダーが利用可能かどうか
   *
   * APIキーが設定されているかなどをチェック
   */
  isAvailable(): boolean;
}

// ========================================
// Service Types
// ========================================

/**
 * キャラクター人物像生成の入力
 */
export interface BiographyGenerationInput {
  /** 出自断片 */
  readonly origin: string;
  /** 喪失断片 */
  readonly loss: string;
  /** 刻印断片 */
  readonly mark: string;
  /** 業断片（任意） */
  readonly sin?: string | null;
  /** 探求断片（任意） */
  readonly quest?: string | null;
  /** 癖/性向断片（任意） */
  readonly trait?: string | null;
}

/**
 * 名前生成の入力
 */
export interface NameGenerationInput {
  /** 人物像 */
  readonly biography: string;
  /** 断片（参考情報） */
  readonly fragments: BiographyGenerationInput;
  /** 生成する候補数 */
  readonly count?: number;
}

/**
 * LLMサービスインターフェース
 *
 * アプリケーションが使用する高レベルなLLM操作
 */
export interface LLMService {
  /**
   * 断片から人物像を生成
   */
  generateBiography(
    input: BiographyGenerationInput,
  ): ResultAsync<string, LLMServiceError>;

  /**
   * 人物像から名前候補を生成
   */
  generateNameSuggestions(
    input: NameGenerationInput,
  ): ResultAsync<string[], LLMServiceError>;
}

// ========================================
// Configuration Types
// ========================================

/**
 * LLMサービス設定
 */
export interface LLMServiceConfig {
  /** 使用するプロバイダー（優先順位順） */
  readonly providers: readonly LLMProviderName[];
  /** デフォルトのタイムアウト（ミリ秒） */
  readonly defaultTimeout?: number;
  /** リトライ回数 */
  readonly retryCount?: number;
}

/**
 * 環境変数から取得するAPIキー
 */
export interface LLMApiKeys {
  readonly groq?: string;
  readonly gemini?: string;
  readonly github?: string;
  readonly openrouter?: string;
}
