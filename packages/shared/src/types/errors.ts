/**
 * ドメインエラー型定義
 *
 * Result<T, E> の E として使用するエラー型を定義
 * 各エラーは code でプログラム的に判別し、message で人間が読める説明を持つ
 */

// ========================================
// Base Error Types
// ========================================

/** 全てのドメインエラーの基底インターフェース */
export interface BaseError {
  readonly code: string;
  readonly message: string;
}

// ========================================
// Authentication Errors
// ========================================

export interface UnauthorizedError extends BaseError {
  readonly code: "UNAUTHORIZED";
}

export interface ForbiddenError extends BaseError {
  readonly code: "FORBIDDEN";
}

export interface SessionExpiredError extends BaseError {
  readonly code: "SESSION_EXPIRED";
}

export type AuthError = UnauthorizedError | ForbiddenError | SessionExpiredError;

// ========================================
// Validation Errors
// ========================================

export interface ValidationError extends BaseError {
  readonly code: "VALIDATION_ERROR";
  readonly field?: string;
  readonly details?: Record<string, string>;
}

export interface InvalidInputError extends BaseError {
  readonly code: "INVALID_INPUT";
  readonly field: string;
}

// ========================================
// Resource Errors
// ========================================

export interface NotFoundError extends BaseError {
  readonly code: "NOT_FOUND";
  readonly resource: string;
  readonly id?: string;
}

export interface AlreadyExistsError extends BaseError {
  readonly code: "ALREADY_EXISTS";
  readonly resource: string;
}

export interface ResourceLimitError extends BaseError {
  readonly code: "RESOURCE_LIMIT";
  readonly resource: string;
  readonly limit: number;
}

export type ResourceError = NotFoundError | AlreadyExistsError | ResourceLimitError;

// ========================================
// Database Errors
// ========================================

export interface DatabaseError extends BaseError {
  readonly code: "DATABASE_ERROR";
  readonly operation: "read" | "write" | "delete" | "transaction";
}

export interface ConnectionError extends BaseError {
  readonly code: "CONNECTION_ERROR";
  readonly service: string;
}

// ========================================
// LLM / AI Errors
// ========================================

export interface LLMError extends BaseError {
  readonly code: "LLM_ERROR";
  readonly provider: string;
}

export interface LLMRateLimitError extends BaseError {
  readonly code: "LLM_RATE_LIMIT";
  readonly provider: string;
  readonly retryAfter?: number;
}

export interface LLMGenerationError extends BaseError {
  readonly code: "LLM_GENERATION_ERROR";
  readonly provider: string;
  readonly stage: "plot" | "scene" | "character";
}

export type AIError = LLMError | LLMRateLimitError | LLMGenerationError;

// ========================================
// Game Domain Errors
// ========================================

/** キャラクター関連エラー */
export interface CharacterNotFoundError extends BaseError {
  readonly code: "CHARACTER_NOT_FOUND";
  readonly characterId: string;
}

export interface CharacterNotBorrowableError extends BaseError {
  readonly code: "CHARACTER_NOT_BORROWABLE";
  readonly characterId: string;
  readonly lendingSetting: "private";
}

export interface InvalidPartyCompositionError extends BaseError {
  readonly code: "INVALID_PARTY_COMPOSITION";
  readonly reason: "too_few" | "too_many" | "duplicate";
}

export type CharacterError =
  | CharacterNotFoundError
  | CharacterNotBorrowableError
  | InvalidPartyCompositionError;

/** ダンジョン関連エラー */
export interface DungeonNotFoundError extends BaseError {
  readonly code: "DUNGEON_NOT_FOUND";
  readonly dungeonId: string;
}

export type DungeonError = DungeonNotFoundError;

/** セッション関連エラー */
export interface SessionNotFoundError extends BaseError {
  readonly code: "SESSION_NOT_FOUND";
  readonly sessionId: string;
}

export interface SessionInProgressError extends BaseError {
  readonly code: "SESSION_IN_PROGRESS";
  readonly sessionId: string;
}

export interface SessionGenerationError extends BaseError {
  readonly code: "SESSION_GENERATION_ERROR";
  readonly stage: "resonance" | "plot" | "scenes" | "save";
}

export type SessionError =
  | SessionNotFoundError
  | SessionInProgressError
  | SessionGenerationError;

// ========================================
// Aggregate Error Types
// ========================================

/** 全てのアプリケーションエラー */
export type AppError =
  | AuthError
  | ValidationError
  | InvalidInputError
  | ResourceError
  | DatabaseError
  | ConnectionError
  | AIError
  | CharacterError
  | DungeonError
  | SessionError;

// ========================================
// Error Constructors
// ========================================

/**
 * エラーファクトリ関数
 * 型安全なエラー生成をサポート
 */
export const Errors = {
  // Auth
  unauthorized: (message = "認証が必要です"): UnauthorizedError => ({
    code: "UNAUTHORIZED",
    message,
  }),

  forbidden: (message = "この操作を行う権限がありません"): ForbiddenError => ({
    code: "FORBIDDEN",
    message,
  }),

  sessionExpired: (
    message = "セッションが期限切れです"
  ): SessionExpiredError => ({
    code: "SESSION_EXPIRED",
    message,
  }),

  // Validation
  validation: (
    message: string,
    field?: string,
    details?: Record<string, string>
  ): ValidationError => ({
    code: "VALIDATION_ERROR",
    message,
    field,
    details,
  }),

  invalidInput: (field: string, message: string): InvalidInputError => ({
    code: "INVALID_INPUT",
    field,
    message,
  }),

  // Resource
  notFound: (resource: string, id?: string): NotFoundError => ({
    code: "NOT_FOUND",
    resource,
    id,
    message: id
      ? `${resource}（ID: ${id}）が見つかりません`
      : `${resource}が見つかりません`,
  }),

  alreadyExists: (resource: string, message?: string): AlreadyExistsError => ({
    code: "ALREADY_EXISTS",
    resource,
    message: message ?? `${resource}は既に存在します`,
  }),

  resourceLimit: (
    resource: string,
    limit: number,
    message?: string
  ): ResourceLimitError => ({
    code: "RESOURCE_LIMIT",
    resource,
    limit,
    message: message ?? `${resource}の上限（${limit}）に達しました`,
  }),

  // Database
  database: (
    operation: DatabaseError["operation"],
    message?: string
  ): DatabaseError => ({
    code: "DATABASE_ERROR",
    operation,
    message: message ?? `データベース操作（${operation}）に失敗しました`,
  }),

  connection: (service: string, message?: string): ConnectionError => ({
    code: "CONNECTION_ERROR",
    service,
    message: message ?? `${service}への接続に失敗しました`,
  }),

  // LLM
  llm: (provider: string, message?: string): LLMError => ({
    code: "LLM_ERROR",
    provider,
    message: message ?? `${provider}でエラーが発生しました`,
  }),

  llmRateLimit: (
    provider: string,
    retryAfter?: number
  ): LLMRateLimitError => ({
    code: "LLM_RATE_LIMIT",
    provider,
    retryAfter,
    message: retryAfter
      ? `${provider}のレート制限に達しました。${retryAfter}秒後に再試行してください`
      : `${provider}のレート制限に達しました`,
  }),

  llmGeneration: (
    provider: string,
    stage: LLMGenerationError["stage"],
    message?: string
  ): LLMGenerationError => ({
    code: "LLM_GENERATION_ERROR",
    provider,
    stage,
    message: message ?? `${stage}の生成に失敗しました（${provider}）`,
  }),

  // Character
  characterNotFound: (characterId: string): CharacterNotFoundError => ({
    code: "CHARACTER_NOT_FOUND",
    characterId,
    message: `キャラクター（ID: ${characterId}）が見つかりません`,
  }),

  characterNotBorrowable: (characterId: string): CharacterNotBorrowableError => ({
    code: "CHARACTER_NOT_BORROWABLE",
    characterId,
    lendingSetting: "private",
    message: `このキャラクター（ID: ${characterId}）は借用できません`,
  }),

  invalidPartyComposition: (
    reason: InvalidPartyCompositionError["reason"]
  ): InvalidPartyCompositionError => {
    const messages = {
      too_few: "パーティメンバーが少なすぎます",
      too_many: "パーティメンバーが多すぎます",
      duplicate: "同じキャラクターを複数回選択できません",
    };
    return {
      code: "INVALID_PARTY_COMPOSITION",
      reason,
      message: messages[reason],
    };
  },

  // Dungeon
  dungeonNotFound: (dungeonId: string): DungeonNotFoundError => ({
    code: "DUNGEON_NOT_FOUND",
    dungeonId,
    message: `ダンジョン（ID: ${dungeonId}）が見つかりません`,
  }),

  // Session
  sessionNotFound: (sessionId: string): SessionNotFoundError => ({
    code: "SESSION_NOT_FOUND",
    sessionId,
    message: `セッション（ID: ${sessionId}）が見つかりません`,
  }),

  sessionInProgress: (sessionId: string): SessionInProgressError => ({
    code: "SESSION_IN_PROGRESS",
    sessionId,
    message: `セッション（ID: ${sessionId}）は現在生成中です`,
  }),

  sessionGeneration: (
    stage: SessionGenerationError["stage"],
    message?: string
  ): SessionGenerationError => ({
    code: "SESSION_GENERATION_ERROR",
    stage,
    message: message ?? `セッション生成の${stage}フェーズでエラーが発生しました`,
  }),
} as const;

// ========================================
// Type Guards
// ========================================

export const isAuthError = (error: AppError): error is AuthError =>
  error.code === "UNAUTHORIZED" ||
  error.code === "FORBIDDEN" ||
  error.code === "SESSION_EXPIRED";

export const isResourceError = (error: AppError): error is ResourceError =>
  error.code === "NOT_FOUND" ||
  error.code === "ALREADY_EXISTS" ||
  error.code === "RESOURCE_LIMIT";

export const isAIError = (error: AppError): error is AIError =>
  error.code === "LLM_ERROR" ||
  error.code === "LLM_RATE_LIMIT" ||
  error.code === "LLM_GENERATION_ERROR";
