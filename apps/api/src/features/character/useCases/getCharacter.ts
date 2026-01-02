/**
 * Get Character UseCase
 *
 * 公開キャラクターを取得するユースケース
 * 認証なしでアクセス可能（isPublicかつlending !== 'private'のみ）
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Character, CharacterId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface GetCharacterDeps {
  readonly repository: CharacterRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * キャラクター取得ユースケース
 *
 * 認証なしでアクセス可能
 * isPublic=true かつ lending !== 'private' のキャラクターのみ取得可能
 */
export function getCharacterUseCase(deps: GetCharacterDeps) {
  return (characterId: CharacterId): ResultAsync<Character, AppError> => {
    return deps.repository.findById(characterId).andThen((character) => {
      if (!character) {
        return errAsync(Errors.notFound("Character", characterId as string));
      }

      // 公開チェック
      if (!character.isPublic) {
        return errAsync(Errors.notFound("Character", characterId as string));
      }

      // 借用設定チェック（privateは取得不可）
      if (character.lending === "private") {
        return errAsync(Errors.notFound("Character", characterId as string));
      }

      return okAsync(character);
    });
  };
}
