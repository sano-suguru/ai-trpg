/**
 * List Characters UseCase
 */

import { ResultAsync } from "neverthrow";
import { Character, UserId } from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface ListCharactersDeps {
  readonly repository: CharacterRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * キャラクター一覧取得ユースケース（公開）
 *
 * 認証なしでアクセス可能
 * 借用可能（isPublic=true かつ lending !== 'private'）なキャラクターのみ
 */
export function listCharactersUseCase(deps: ListCharactersDeps) {
  return (): ResultAsync<readonly Character[], AppError> => {
    return deps.repository.findBorrowable();
  };
}

/**
 * 自分のキャラクター一覧取得ユースケース
 *
 * 認証必須
 */
export function listMyCharactersUseCase(deps: ListCharactersDeps) {
  return (userId: UserId): ResultAsync<readonly Character[], AppError> => {
    return deps.repository.findByOwnerId(userId);
  };
}
