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
 * 自分のキャラクター一覧取得ユースケース
 */
export function listMyCharactersUseCase(deps: ListCharactersDeps) {
  return (userId: UserId): ResultAsync<readonly Character[], AppError> => {
    return deps.repository.findByOwnerId(userId);
  };
}

/**
 * 借用可能なキャラクター一覧取得ユースケース
 */
export function listBorrowableCharactersUseCase(deps: ListCharactersDeps) {
  return (): ResultAsync<readonly Character[], AppError> => {
    return deps.repository.findBorrowable();
  };
}
