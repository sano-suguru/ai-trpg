/**
 * レート制限実装
 *
 * Drizzle ORMを使用したレート制限の実装
 */

import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { gte, lt, eq, and, count } from "drizzle-orm";
import {
  Errors,
  type RateLimitError,
  type DatabaseError,
} from "@ai-trpg/shared/types";
import { createLogger } from "../../services/logger";
import type { Database } from "../database/client";
import { llmUsageLogs } from "../database/schema";

const logger = createLogger("RateLimit");

// ========================================
// Constants
// ========================================

/** クリーンアップを実行する確率（10%） */
const CLEANUP_PROBABILITY = 0.1;

/** クリーンアップ対象とする古さ（24時間） */
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;

// ========================================
// Types
// ========================================

export interface RateLimitConfig {
  /** 時間ウィンドウ内の最大リクエスト数 */
  readonly maxRequests: number;
  /** 時間ウィンドウ（ミリ秒） */
  readonly windowMs: number;
}

/** デフォルト: 1分あたり10リクエスト */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

// ========================================
// Rate Limit Check
// ========================================

/**
 * レート制限をチェック
 *
 * @param db - データベースインスタンス
 * @param userId - チェック対象のユーザーID
 * @param endpoint - アクセス対象のエンドポイント
 * @param config - レート制限設定
 * @returns 制限内ならOk、超過ならErr
 */
export function checkRateLimit(
  db: Database,
  userId: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): ResultAsync<void, RateLimitError | DatabaseError> {
  const windowStart = new Date(Date.now() - config.windowMs);

  return ResultAsync.fromPromise(
    db
      .select({ count: count() })
      .from(llmUsageLogs)
      .where(
        and(
          eq(llmUsageLogs.userId, userId),
          eq(llmUsageLogs.endpoint, endpoint),
          gte(llmUsageLogs.createdAt, windowStart),
        ),
      )
      .then((result) => result[0]?.count ?? 0),
    (error) =>
      Errors.database(
        "read",
        `レート制限チェック失敗: ${error instanceof Error ? error.message : "不明なエラー"}`,
      ),
  ).andThen((requestCount) => {
    if (requestCount >= config.maxRequests) {
      const retryAfter = Math.ceil(config.windowMs / 1000);
      logger.warn("Rate limit exceeded", {
        userId,
        endpoint,
        requestCount,
        maxRequests: config.maxRequests,
        retryAfter,
      });
      return errAsync(Errors.rateLimit(endpoint, retryAfter));
    }
    logger.debug("Rate limit check passed", {
      userId,
      endpoint,
      requestCount,
      maxRequests: config.maxRequests,
    });
    return okAsync(undefined);
  });
}

// ========================================
// Usage Logging
// ========================================

/**
 * API使用をログに記録
 *
 * @param db - データベースインスタンス
 * @param userId - リクエストを行ったユーザーID
 * @param endpoint - アクセス対象のエンドポイント
 * @returns 成功時Ok、データベースエラー時Err
 */
export function logUsage(
  db: Database,
  userId: string,
  endpoint: string,
): ResultAsync<void, DatabaseError> {
  return ResultAsync.fromPromise(
    db
      .insert(llmUsageLogs)
      .values({
        userId,
        endpoint,
      })
      .then(() => undefined),
    (error) =>
      Errors.database(
        "write",
        `使用ログ記録失敗: ${error instanceof Error ? error.message : "不明なエラー"}`,
      ),
  );
}

// ========================================
// Cleanup
// ========================================

/**
 * 古いログをベストエフォートで削除
 *
 * 確率的に実行し、負荷を分散する。
 * 失敗しても無視する（ガベージコレクション的な役割）。
 *
 * @param db - データベースインスタンス
 */
function cleanupOldLogs(db: Database): void {
  // 確率的に実行（10%）
  if (Math.random() >= CLEANUP_PROBABILITY) {
    return;
  }

  const cutoff = new Date(Date.now() - CLEANUP_AGE_MS);

  // fire-and-forget: 結果を待たない、エラーも無視
  db.delete(llmUsageLogs)
    .where(lt(llmUsageLogs.createdAt, cutoff))
    .then(() => {
      logger.debug("Old logs cleanup completed");
    })
    .catch((error) => {
      logger.warn("Old logs cleanup failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
}

// ========================================
// Rate Limited Execution
// ========================================

/**
 * レート制限付きで関数を実行
 *
 * レート制限をチェックし、使用をログに記録してから関数を実行する。
 * ログ記録の失敗は致命的ではない（ユーザー体験を優先）。
 *
 * @param db - データベースインスタンス
 * @param userId - リクエストを行ったユーザーID
 * @param endpoint - アクセス対象のエンドポイント
 * @param fn - レート制限チェック通過後に実行する関数
 * @param config - レート制限設定
 * @returns 関数の結果、またはレート制限/データベースエラー
 *
 * @example
 * ```typescript
 * const result = await withRateLimit(
 *   db,
 *   userId,
 *   "generateBiography",
 *   () => llmService.generateBiography(input),
 * );
 *
 * if (result.isErr()) {
 *   // レート制限やその他のエラーを処理
 * }
 * ```
 */
export function withRateLimit<T, E>(
  db: Database,
  userId: string,
  endpoint: string,
  fn: () => ResultAsync<T, E>,
  config: RateLimitConfig = DEFAULT_CONFIG,
): ResultAsync<T, RateLimitError | DatabaseError | E> {
  // ベストエフォートで古いログを削除（確率的、非同期）
  cleanupOldLogs(db);

  return (
    checkRateLimit(db, userId, endpoint, config)
      // 使用ログ記録（失敗してもユーザー体験を優先して続行）
      .andThen(() =>
        logUsage(db, userId, endpoint).orElse((error) => {
          logger.warn("Usage log recording failed", {
            userId,
            endpoint,
            error: error.message,
          });
          return okAsync(undefined);
        }),
      )
      .andThen(() => fn())
  );
}
