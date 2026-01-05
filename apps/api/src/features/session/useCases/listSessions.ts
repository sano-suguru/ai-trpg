/**
 * セッション一覧取得ユースケース
 */

import { ResultAsync } from "neverthrow";
import { Session, UserId } from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import type { SessionRepository } from "../repository";

// ========================================
// Input / Output
// ========================================

export interface ListSessionsInput {
  readonly userId: UserId;
}

export interface ListSessionsOutput {
  readonly sessions: readonly Session[];
}

// ========================================
// Dependencies
// ========================================

export interface ListSessionsDeps {
  readonly sessionRepo: SessionRepository;
}

// ========================================
// Use Case
// ========================================

/**
 * ユーザーのセッション一覧を取得
 */
export function listSessionsUseCase(
  input: ListSessionsInput,
  deps: ListSessionsDeps,
): ResultAsync<ListSessionsOutput, AppError> {
  const { userId } = input;
  const { sessionRepo } = deps;

  return sessionRepo.findByUserId(userId).map((sessions) => ({ sessions }));
}
