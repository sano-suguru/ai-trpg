/**
 * Result型ユーティリティ
 *
 * neverthrowのResult/ResultAsyncを拡張するヘルパー関数群
 * 外部ライブラリの例外をResultに変換するためのユーティリティを提供
 */

import {
  Result,
  ResultAsync,
  ok,
  err,
  okAsync,
  errAsync,
} from "neverthrow";
import type { AppError, DatabaseError, ConnectionError } from "../types/errors.js";
import { Errors } from "../types/errors.js";

// ========================================
// Re-exports from neverthrow
// ========================================

export { Result, ResultAsync, ok, err, okAsync, errAsync };

// ========================================
// Type Aliases
// ========================================

/**
 * AppError を使用したResult型のエイリアス
 */
export type AppResult<T> = Result<T, AppError>;

/**
 * AppError を使用したResultAsync型のエイリアス
 */
export type AppResultAsync<T> = ResultAsync<T, AppError>;

// ========================================
// Promise Wrappers
// ========================================

/**
 * PromiseをResultAsyncに変換
 * 外部ライブラリからのPromiseをResult型に変換する際に使用
 *
 * @example
 * ```ts
 * const result = await wrapPromise(
 *   fetch('/api/data'),
 *   (e) => Errors.connection('API', String(e))
 * )
 * ```
 */
export function wrapPromise<T, E>(
  promise: Promise<T>,
  errorMapper: (error: unknown) => E
): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, errorMapper);
}

/**
 * データベース操作をResultAsyncに変換
 *
 * @example
 * ```ts
 * const result = await wrapDbOperation(
 *   db.select().from(users).where(eq(users.id, id)),
 *   'read'
 * )
 * ```
 */
export function wrapDbOperation<T>(
  promise: Promise<T>,
  operation: DatabaseError["operation"]
): ResultAsync<T, DatabaseError> {
  return ResultAsync.fromPromise(promise, (error) =>
    Errors.database(operation, String(error))
  );
}

/**
 * 外部サービス呼び出しをResultAsyncに変換
 *
 * @example
 * ```ts
 * const result = await wrapExternalCall(
 *   supabase.auth.getUser(),
 *   'Supabase'
 * )
 * ```
 */
export function wrapExternalCall<T>(
  promise: Promise<T>,
  serviceName: string
): ResultAsync<T, ConnectionError> {
  return ResultAsync.fromPromise(promise, (error) =>
    Errors.connection(serviceName, String(error))
  );
}

// ========================================
// Result Combinators
// ========================================

/**
 * 複数のResultを結合し、全てのエラーを収集
 * フォームバリデーションなど、全エラーを表示したい場合に使用
 *
 * @example
 * ```ts
 * const results = [
 *   validateName(name),
 *   validateEmail(email),
 *   validatePassword(password),
 * ]
 * const combined = combineAllErrors(results)
 * // combined: Result<[string, string, string], AppError[]>
 * ```
 */
export function combineAllErrors<T, E>(
  results: Result<T, E>[]
): Result<readonly T[], E[]> {
  return Result.combineWithAllErrors(results);
}

// ========================================
// Error Mapping
// ========================================

/**
 * エラーコードに基づいてHTTPステータスコードを取得
 * APIレスポンス生成時に使用
 */
export function getHttpStatusFromError(error: AppError): number {
  switch (error.code) {
    // 4xx Client Errors
    case "UNAUTHORIZED":
    case "SESSION_EXPIRED":
      return 401;
    case "FORBIDDEN":
    case "CHARACTER_NOT_BORROWABLE":
      return 403;
    case "NOT_FOUND":
    case "CHARACTER_NOT_FOUND":
    case "DUNGEON_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return 404;
    case "ALREADY_EXISTS":
      return 409;
    case "VALIDATION_ERROR":
    case "INVALID_INPUT":
    case "INVALID_PARTY_COMPOSITION":
      return 400;
    case "RESOURCE_LIMIT":
      return 429;

    // 5xx Server Errors
    case "DATABASE_ERROR":
    case "CONNECTION_ERROR":
    case "LLM_ERROR":
    case "LLM_GENERATION_ERROR":
    case "SESSION_GENERATION_ERROR":
      return 500;
    case "LLM_RATE_LIMIT":
      return 503;
    case "SESSION_IN_PROGRESS":
      return 202; // Accepted (処理中)

    default:
      return 500;
  }
}

/**
 * エラーをAPIレスポンス形式に変換
 */
export function toErrorResponse(error: AppError): {
  status: number;
  body: { code: string; message: string; details?: unknown };
} {
  return {
    status: getHttpStatusFromError(error),
    body: {
      code: error.code,
      message: error.message,
      ...("details" in error && { details: error.details }),
      ...("field" in error && { field: error.field }),
    },
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * nullableな値をResultに変換
 *
 * @example
 * ```ts
 * const user = await db.query.users.findFirst(...)
 * const result = fromNullable(user, Errors.notFound('User', id))
 * ```
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<T, E> {
  return value != null ? ok(value) : err(error);
}

/**
 * 条件に基づいてResultを生成
 *
 * @example
 * ```ts
 * const result = fromPredicate(
 *   age >= 18,
 *   () => age,
 *   () => Errors.validation('18歳以上である必要があります')
 * )
 * ```
 */
export function fromPredicate<T, E>(
  condition: boolean,
  onTrue: () => T,
  onFalse: () => E
): Result<T, E> {
  return condition ? ok(onTrue()) : err(onFalse());
}

/**
 * try-catchブロックをResultに変換（同期処理用）
 * 外部ライブラリが例外をthrowする場合に使用
 *
 * @example
 * ```ts
 * const result = tryCatch(
 *   () => JSON.parse(jsonString),
 *   (e) => Errors.validation('Invalid JSON format')
 * )
 * ```
 */
export function tryCatch<T, E>(
  fn: () => T,
  errorMapper: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(errorMapper(error));
  }
}
