/**
 * Update Dungeon UseCase
 */

import { ResultAsync, errAsync } from "neverthrow";
import {
  Dungeon,
  DungeonId,
  UserId,
  updateDungeon,
  UpdateDungeonInput,
} from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface UpdateDungeonDeps {
  readonly repository: DungeonRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * ダンジョン更新ユースケース
 *
 * 作成者のみが更新可能
 */
export function updateDungeonUseCase(deps: UpdateDungeonDeps) {
  return (
    userId: UserId,
    dungeonId: DungeonId,
    input: UpdateDungeonInput,
  ): ResultAsync<Dungeon, AppError> => {
    return deps.repository.findById(dungeonId).andThen((dungeon) => {
      if (!dungeon) {
        return errAsync(Errors.notFound("Dungeon", dungeonId as string));
      }

      // 作成者チェック
      if (dungeon.authorId !== userId) {
        return errAsync(
          Errors.forbidden("このダンジョンを更新する権限がありません"),
        );
      }

      // ドメインモデルを更新
      const updatedResult = updateDungeon(dungeon, input);
      if (updatedResult.isErr()) {
        return errAsync(updatedResult.error as AppError);
      }

      // 永続化
      return deps.repository.update(updatedResult.value);
    });
  };
}
