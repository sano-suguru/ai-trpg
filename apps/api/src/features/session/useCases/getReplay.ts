/**
 * リプレイ取得ユースケース
 */

import { ResultAsync, err, ok } from "neverthrow";
import { Replay, ReplayId, SessionId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { SessionRepository, ReplayRepository } from "../repository";

// ========================================
// Input / Output
// ========================================

export interface GetReplayInput {
  readonly replayId: ReplayId;
  readonly userId: UserId;
}

export interface GetReplayBySessionInput {
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface GetReplayOutput {
  readonly replay: Replay;
}

// ========================================
// Dependencies
// ========================================

export interface GetReplayDeps {
  readonly replayRepo: ReplayRepository;
  readonly sessionRepo: SessionRepository;
}

// ========================================
// Use Cases
// ========================================

/**
 * リプレイIDでリプレイを取得
 */
export function getReplayUseCase(
  input: GetReplayInput,
  deps: GetReplayDeps,
): ResultAsync<GetReplayOutput, AppError> {
  const { replayId, userId } = input;
  const { replayRepo, sessionRepo } = deps;

  return replayRepo.findById(replayId).andThen((replay) => {
    if (!replay) {
      return err(Errors.notFound("Replay", replayId as string));
    }

    // セッション経由で所有権チェック
    return sessionRepo.findById(replay.sessionId).andThen((session) => {
      if (!session) {
        return err(Errors.notFound("Session", replay.sessionId as string));
      }

      if (session.userId !== userId) {
        return err(
          Errors.forbidden("このリプレイにアクセスする権限がありません"),
        );
      }

      return ok({ replay });
    });
  });
}

/**
 * セッションIDでリプレイを取得
 */
export function getReplayBySessionUseCase(
  input: GetReplayBySessionInput,
  deps: GetReplayDeps,
): ResultAsync<GetReplayOutput, AppError> {
  const { sessionId, userId } = input;
  const { replayRepo, sessionRepo } = deps;

  // まずセッションの所有権をチェック
  return sessionRepo.findById(sessionId).andThen((session) => {
    if (!session) {
      return err(Errors.notFound("Session", sessionId as string));
    }

    if (session.userId !== userId) {
      return err(
        Errors.forbidden("このセッションにアクセスする権限がありません"),
      );
    }

    // リプレイを取得
    return replayRepo.findBySessionId(sessionId).andThen((replay) => {
      if (!replay) {
        return err(Errors.notFound("Replay", `session:${sessionId as string}`));
      }

      return ok({ replay });
    });
  });
}
