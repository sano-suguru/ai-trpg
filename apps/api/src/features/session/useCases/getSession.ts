/**
 * セッション取得ユースケース
 */

import { ResultAsync, err, ok } from "neverthrow";
import { Session, SessionId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { SessionRepository } from "../repository";

// ========================================
// Input / Output
// ========================================

export interface GetSessionInput {
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface GetSessionOutput {
  readonly session: Session;
}

// ========================================
// Dependencies
// ========================================

export interface GetSessionDeps {
  readonly sessionRepo: SessionRepository;
}

// ========================================
// Use Case
// ========================================

/**
 * セッションを取得
 */
export function getSessionUseCase(
  input: GetSessionInput,
  deps: GetSessionDeps,
): ResultAsync<GetSessionOutput, AppError> {
  const { sessionId, userId } = input;
  const { sessionRepo } = deps;

  return sessionRepo.findById(sessionId).andThen((session) => {
    if (!session) {
      return err(Errors.notFound("Session", sessionId as string));
    }

    // 所有権チェック
    if (session.userId !== userId) {
      return err(
        Errors.forbidden("このセッションにアクセスする権限がありません"),
      );
    }

    return ok({ session });
  });
}
