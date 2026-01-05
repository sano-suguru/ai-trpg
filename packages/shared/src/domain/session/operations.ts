/**
 * セッション操作関数
 *
 * セッションの状態遷移を純粋関数として提供
 */

import { Result, ok, err } from "neverthrow";
import { Errors, ValidationError } from "../../types/errors";
import { ReplayId } from "../primitives/ids";
import {
  Session,
  SessionStatuses,
  TriggeredEvent,
  SessionStructure,
} from "./types";

// ========================================
// State Transitions
// ========================================

/**
 * セッションを生成中状態に遷移
 */
export function startGenerating(
  session: Session,
  triggeredEvents: readonly TriggeredEvent[],
): Result<Session, ValidationError> {
  if (session.status !== SessionStatuses.PENDING) {
    return err(
      Errors.validation(
        `生成開始できるのは待機中のセッションのみです（現在: ${session.status}）`,
        "status",
      ),
    );
  }

  return ok({
    ...session,
    status: SessionStatuses.GENERATING,
    triggeredEvents,
  });
}

/**
 * プロット構造を設定
 */
export function setStructure(
  session: Session,
  structure: SessionStructure,
): Result<Session, ValidationError> {
  if (session.status !== SessionStatuses.GENERATING) {
    return err(
      Errors.validation(
        `プロット設定は生成中のセッションのみ可能です（現在: ${session.status}）`,
        "status",
      ),
    );
  }

  return ok({
    ...session,
    structure,
  });
}

/**
 * セッションを完了状態に遷移
 */
export function completeSession(
  session: Session,
  replayId: ReplayId,
): Result<Session, ValidationError> {
  if (session.status !== SessionStatuses.GENERATING) {
    return err(
      Errors.validation(
        `完了できるのは生成中のセッションのみです（現在: ${session.status}）`,
        "status",
      ),
    );
  }

  return ok({
    ...session,
    status: SessionStatuses.COMPLETED,
    replayId,
    completedAt: new Date(),
  });
}

/**
 * セッションを失敗状態に遷移
 */
export function failSession(
  session: Session,
  errorMessage: string,
): Result<Session, ValidationError> {
  // 失敗はどの状態からでも可能（ただし既に完了/失敗している場合は除く）
  if (
    session.status === SessionStatuses.COMPLETED ||
    session.status === SessionStatuses.FAILED
  ) {
    return err(
      Errors.validation(
        `既に終了したセッションは失敗にできません（現在: ${session.status}）`,
        "status",
      ),
    );
  }

  return ok({
    ...session,
    status: SessionStatuses.FAILED,
    errorMessage,
    completedAt: new Date(),
  });
}

// ========================================
// Query Functions
// ========================================

/**
 * セッションが完了しているか
 */
export function isCompleted(session: Session): boolean {
  return session.status === SessionStatuses.COMPLETED;
}

/**
 * セッションが失敗しているか
 */
export function isFailed(session: Session): boolean {
  return session.status === SessionStatuses.FAILED;
}

/**
 * セッションが終了しているか（完了または失敗）
 */
export function isFinished(session: Session): boolean {
  return isCompleted(session) || isFailed(session);
}

/**
 * セッションが生成中か
 */
export function isGenerating(session: Session): boolean {
  return session.status === SessionStatuses.GENERATING;
}

/**
 * 共鳴イベントの数を取得
 */
export function getTriggeredEventCount(session: Session): number {
  return session.triggeredEvents.length;
}

/**
 * 高優先度の共鳴イベントを取得
 */
export function getHighPriorityEvents(
  session: Session,
): readonly TriggeredEvent[] {
  return session.triggeredEvents.filter((e) => e.priority === "high");
}
