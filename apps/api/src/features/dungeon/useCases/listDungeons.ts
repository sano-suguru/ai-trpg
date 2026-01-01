/**
 * List Dungeons UseCase
 */

import { ResultAsync } from "neverthrow";
import {
  UserId,
  DungeonSummary,
  toDungeonSummary,
} from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "../repository";

// ========================================
// UseCase Types
// ========================================

export interface ListDungeonsDeps {
  readonly repository: DungeonRepository;
}

// ========================================
// UseCase Implementation
// ========================================

/**
 * 公開ダンジョン一覧取得ユースケース
 */
export function listPublicDungeonsUseCase(deps: ListDungeonsDeps) {
  return (): ResultAsync<readonly DungeonSummary[], AppError> => {
    return deps.repository
      .findPublic()
      .map((dungeons) => dungeons.map(toDungeonSummary));
  };
}

/**
 * 自分のダンジョン一覧取得ユースケース
 */
export function listMyDungeonsUseCase(deps: ListDungeonsDeps) {
  return (userId: UserId): ResultAsync<readonly DungeonSummary[], AppError> => {
    return deps.repository
      .findByAuthorId(userId)
      .map((dungeons) => dungeons.map(toDungeonSummary));
  };
}
