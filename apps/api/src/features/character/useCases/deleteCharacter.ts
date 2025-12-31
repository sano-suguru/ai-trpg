/**
 * Delete Character UseCase
 */

import { ResultAsync, err } from "neverthrow";
import { CharacterId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface DeleteCharacterDeps {
  readonly repository: CharacterRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * キャラクター削除ユースケース
 */
export function deleteCharacterUseCase(deps: DeleteCharacterDeps) {
  return (
    userId: UserId,
    characterId: CharacterId,
  ): ResultAsync<void, AppError> => {
    return deps.repository.findById(characterId).andThen((character) => {
      if (!character) {
        return err(Errors.notFound("Character", characterId as string));
      }

      // 所有者チェック
      if (character.ownerId !== userId) {
        return err(
          Errors.forbidden("このキャラクターへのアクセス権がありません"),
        );
      }

      // 削除
      return deps.repository.delete(characterId);
    });
  };
}
