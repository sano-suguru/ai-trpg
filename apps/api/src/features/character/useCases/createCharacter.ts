/**
 * Create Character UseCase
 */

import { ResultAsync, err } from "neverthrow";
import {
  Character,
  UserId,
  UnsafeIds,
  createCharacter,
  CreateCharacterInput,
} from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface CreateCharacterDeps {
  readonly repository: CharacterRepository;
  readonly generateId: () => string;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * キャラクター作成ユースケース
 */
export function createCharacterUseCase(deps: CreateCharacterDeps) {
  return (
    userId: UserId,
    input: CreateCharacterInput
  ): ResultAsync<Character, AppError> => {
    // 新しいIDを生成
    const characterId = UnsafeIds.characterId(deps.generateId());

    // ドメインモデルを作成（バリデーション）
    const characterResult = createCharacter(characterId, userId, input);

    if (characterResult.isErr()) {
      return ResultAsync.fromSafePromise(
        Promise.resolve(err(characterResult.error as AppError))
      ).andThen((r) => r);
    }

    // 永続化
    return deps.repository.save(characterResult.value);
  };
}
