/**
 * Get My Character UseCase
 *
 * 所有者が自分のキャラクターを取得するユースケース
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Character, CharacterId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface GetMyCharacterDeps {
  readonly repository: CharacterRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * 自分のキャラクター取得ユースケース
 *
 * 所有者のみがアクセス可能
 */
export function getMyCharacterUseCase(deps: GetMyCharacterDeps) {
  return (
    userId: UserId,
    characterId: CharacterId,
  ): ResultAsync<Character, AppError> => {
    return deps.repository.findById(characterId).andThen((character) => {
      if (!character) {
        return errAsync(Errors.notFound("Character", characterId as string));
      }

      // 所有者チェック
      if (character.ownerId !== userId) {
        return errAsync(
          Errors.forbidden("このキャラクターへのアクセス権がありません"),
        );
      }

      return okAsync(character);
    });
  };
}
