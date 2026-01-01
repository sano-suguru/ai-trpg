/**
 * Get Dungeon UseCase
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Dungeon, DungeonId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface GetDungeonDeps {
  readonly repository: DungeonRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * ダンジョン取得ユースケース
 *
 * 公開ダンジョンまたは自分のダンジョンのみアクセス可能
 */
export function getDungeonUseCase(deps: GetDungeonDeps) {
  return (
    userId: UserId | null,
    dungeonId: DungeonId,
  ): ResultAsync<Dungeon, AppError> => {
    return deps.repository.findById(dungeonId).andThen((dungeon) => {
      if (!dungeon) {
        return errAsync(Errors.notFound("Dungeon", dungeonId as string));
      }

      // 公開ダンジョンまたは自分のダンジョンならアクセス可能
      if (dungeon.isPublic || (userId && dungeon.authorId === userId)) {
        return okAsync(dungeon);
      }

      return errAsync(
        Errors.forbidden("このダンジョンへのアクセス権がありません"),
      );
    });
  };
}
