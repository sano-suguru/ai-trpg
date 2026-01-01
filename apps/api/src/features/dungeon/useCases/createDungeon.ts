/**
 * Create Dungeon UseCase
 */

import { ResultAsync, errAsync } from "neverthrow";
import {
  Dungeon,
  UserId,
  UnsafeIds,
  createDungeon,
  CreateDungeonInput,
} from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface CreateDungeonDeps {
  readonly repository: DungeonRepository;
  readonly generateId: () => string;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * ダンジョン作成ユースケース
 */
export function createDungeonUseCase(deps: CreateDungeonDeps) {
  return (
    authorId: UserId,
    input: CreateDungeonInput,
  ): ResultAsync<Dungeon, AppError> => {
    // 新しいIDを生成
    const dungeonId = UnsafeIds.dungeonId(deps.generateId());

    // ドメインモデルを作成（バリデーション）
    const dungeonResult = createDungeon(dungeonId, authorId, input);

    if (dungeonResult.isErr()) {
      return errAsync(dungeonResult.error as AppError);
    }

    // 永続化
    return deps.repository.save(dungeonResult.value);
  };
}
