/**
 * セッション作成ユースケース
 *
 * 新しいセッションを作成（pending状態で保存）
 */

import { ResultAsync, err, ok } from "neverthrow";
import {
  Session,
  UserId,
  DungeonId,
  CharacterId,
  createSession,
  UnsafeIds,
} from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { SessionRepository } from "../repository";
import type { DungeonRepository } from "../../dungeon/repository";
import type { CharacterRepository } from "../../character/repository";

// ========================================
// Input / Output
// ========================================

export interface CreateSessionInput {
  readonly userId: UserId;
  readonly dungeonId: DungeonId;
  readonly party: readonly CharacterId[];
}

export interface CreateSessionOutput {
  readonly session: Session;
}

// ========================================
// Dependencies
// ========================================

export interface CreateSessionDeps {
  readonly sessionRepo: SessionRepository;
  readonly dungeonRepo: DungeonRepository;
  readonly characterRepo: CharacterRepository;
  readonly generateId: () => string;
}

// ========================================
// Use Case
// ========================================

/**
 * セッションを作成
 *
 * 1. ダンジョンの存在確認
 * 2. パーティメンバーの存在・所有権確認
 * 3. セッション作成（pending状態）
 */
export function createSessionUseCase(
  input: CreateSessionInput,
  deps: CreateSessionDeps,
): ResultAsync<CreateSessionOutput, AppError> {
  const { userId, dungeonId, party } = input;
  const { sessionRepo, dungeonRepo, characterRepo, generateId } = deps;

  // ダンジョン確認
  return dungeonRepo
    .findById(dungeonId)
    .andThen((dungeon) => {
      if (!dungeon) {
        return err(Errors.notFound("Dungeon", dungeonId as string));
      }

      // ダンジョンがpublicか、自分が作者か
      if (!dungeon.isPublic && dungeon.authorId !== userId) {
        return err(
          Errors.forbidden("このダンジョンにアクセスする権限がありません"),
        );
      }

      return ok(dungeon);
    })
    .andThen(() => {
      // パーティメンバー確認
      return ResultAsync.combine(
        party.map((charId) => characterRepo.findById(charId)),
      );
    })
    .andThen((characters) => {
      // 全キャラクターが存在するか
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        if (!char) {
          return err(Errors.notFound("Character", party[i] as string));
        }

        // 自分のキャラか、借用可能か
        if (char.ownerId !== userId) {
          if (char.lending === "private" || !char.isPublic) {
            return err(
              Errors.forbidden(
                `キャラクター「${char.name}」を使用する権限がありません`,
              ),
            );
          }
        }
      }

      // セッション作成
      const sessionId = UnsafeIds.sessionId(generateId());
      const sessionResult = createSession({
        id: sessionId,
        userId,
        dungeonId,
        party,
      });

      if (sessionResult.isErr()) {
        return err(Errors.validation(sessionResult.error.message, "session"));
      }

      return ok(sessionResult.value);
    })
    .andThen((session) => {
      // 保存
      return sessionRepo.save(session);
    })
    .map((session) => ({ session }));
}
