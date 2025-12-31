/**
 * ドメインID型定義
 *
 * Branded Typeを使用して、異なるエンティティのIDを型レベルで区別する
 * これにより、CharacterIdとUserIdを間違えて渡すことがコンパイル時に検出される
 */

import { Result, ok, err } from "neverthrow";
import { Brand, asBrand, isValidUuid } from "../../lib/brand";
import { Errors, ValidationError } from "../../types/errors";

// ========================================
// ID Branded Types
// ========================================

/** ユーザーID */
export type UserId = Brand<string, "UserId">;

/** キャラクターID */
export type CharacterId = Brand<string, "CharacterId">;

/** ダンジョンID */
export type DungeonId = Brand<string, "DungeonId">;

/** セッションID */
export type SessionId = Brand<string, "SessionId">;

/** リプレイID */
export type ReplayId = Brand<string, "ReplayId">;

// ========================================
// Smart Constructors（バリデーション付き）
// ========================================

/**
 * UserIdを生成（バリデーション付き）
 * 外部からの入力を受け付ける際に使用
 */
export function createUserId(value: string): Result<UserId, ValidationError> {
  if (!isValidUuid(value)) {
    return err(Errors.validation("無効なユーザーIDです", "userId"));
  }
  return ok(asBrand<"UserId">(value));
}

/**
 * CharacterIdを生成（バリデーション付き）
 */
export function createCharacterId(
  value: string
): Result<CharacterId, ValidationError> {
  if (!isValidUuid(value)) {
    return err(Errors.validation("無効なキャラクターIDです", "characterId"));
  }
  return ok(asBrand<"CharacterId">(value));
}

/**
 * DungeonIdを生成（バリデーション付き）
 */
export function createDungeonId(
  value: string
): Result<DungeonId, ValidationError> {
  if (!isValidUuid(value)) {
    return err(Errors.validation("無効なダンジョンIDです", "dungeonId"));
  }
  return ok(asBrand<"DungeonId">(value));
}

/**
 * SessionIdを生成（バリデーション付き）
 */
export function createSessionId(
  value: string
): Result<SessionId, ValidationError> {
  if (!isValidUuid(value)) {
    return err(Errors.validation("無効なセッションIDです", "sessionId"));
  }
  return ok(asBrand<"SessionId">(value));
}

/**
 * ReplayIdを生成（バリデーション付き）
 */
export function createReplayId(
  value: string
): Result<ReplayId, ValidationError> {
  if (!isValidUuid(value)) {
    return err(Errors.validation("無効なリプレイIDです", "replayId"));
  }
  return ok(asBrand<"ReplayId">(value));
}

// ========================================
// Unsafe Constructors（信頼できるソース用）
// ========================================

/**
 * 信頼できるソース（データベース等）からIDを生成
 * バリデーションをスキップするため、使用には注意が必要
 *
 * @example
 * ```ts
 * // DBから取得した値に使用
 * const userId = UnsafeIds.userId(row.id);
 *
 * // 新規生成時に使用
 * const newId = UnsafeIds.characterId(crypto.randomUUID());
 * ```
 */
export const UnsafeIds = {
  userId: (value: string): UserId => asBrand<"UserId">(value),
  characterId: (value: string): CharacterId => asBrand<"CharacterId">(value),
  dungeonId: (value: string): DungeonId => asBrand<"DungeonId">(value),
  sessionId: (value: string): SessionId => asBrand<"SessionId">(value),
  replayId: (value: string): ReplayId => asBrand<"ReplayId">(value),
} as const;

// ========================================
// Type Guards
// ========================================

/**
 * 値がUserId型かどうかを検証
 * 注意: 実行時にはブランドは存在しないため、UUID形式のみをチェック
 */
export function isUserId(value: unknown): value is UserId {
  return isValidUuid(value);
}

export function isCharacterId(value: unknown): value is CharacterId {
  return isValidUuid(value);
}

export function isDungeonId(value: unknown): value is DungeonId {
  return isValidUuid(value);
}

export function isSessionId(value: unknown): value is SessionId {
  return isValidUuid(value);
}

export function isReplayId(value: unknown): value is ReplayId {
  return isValidUuid(value);
}
