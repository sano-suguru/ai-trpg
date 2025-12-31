/**
 * Update Character UseCase
 */

import { ResultAsync, err } from "neverthrow";
import {
  Character,
  CharacterId,
  UserId,
  updateCharacter,
  UpdateCharacterInput,
} from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface UpdateCharacterDeps {
  readonly repository: CharacterRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * キャラクター更新ユースケース
 */
export function updateCharacterUseCase(deps: UpdateCharacterDeps) {
  return (
    userId: UserId,
    characterId: CharacterId,
    input: UpdateCharacterInput,
  ): ResultAsync<Character, AppError> => {
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

      // ドメインモデルを更新
      const updateResult = updateCharacter(character, input);
      if (updateResult.isErr()) {
        return err(updateResult.error as AppError);
      }

      // 永続化
      return deps.repository.update(updateResult.value);
    });
  };
}
