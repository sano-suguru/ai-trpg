/**
 * Delete Dungeon UseCase
 */

import { ResultAsync, errAsync } from "neverthrow";
import { DungeonId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface DeleteDungeonDeps {
  readonly repository: DungeonRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * ダンジョン削除ユースケース
 *
 * 作成者のみが削除可能
 */
export function deleteDungeonUseCase(deps: DeleteDungeonDeps) {
  return (
    userId: UserId,
    dungeonId: DungeonId,
  ): ResultAsync<void, AppError> => {
    return deps.repository.findById(dungeonId).andThen((dungeon) => {
      if (!dungeon) {
        return errAsync(Errors.notFound("Dungeon", dungeonId as string));
      }

      // 作成者チェック
      if (dungeon.authorId !== userId) {
        return errAsync(
          Errors.forbidden("このダンジョンを削除する権限がありません"),
        );
      }

      return deps.repository.delete(dungeonId);
    });
  };
}
