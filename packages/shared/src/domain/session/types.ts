/**
 * セッション集約型定義
 *
 * セッションのライフサイクル状態を判別共用体で表現し、
 * 生成パイプラインの各段階を型安全に管理する
 */

import { Result, ok, err } from "neverthrow";
import { Errors, ValidationError } from "../../types/errors";
import {
  SessionId,
  ReplayId,
  UserId,
  DungeonId,
  CharacterId,
} from "../primitives/ids";
import { FragmentCategory } from "../character/fragments";

// ========================================
// Session Status
// ========================================

/**
 * セッションステータス
 */
export const SessionStatuses = {
  /** 生成待ち */
  PENDING: "pending",
  /** 生成中 */
  GENERATING: "generating",
  /** 完了 */
  COMPLETED: "completed",
  /** 失敗 */
  FAILED: "failed",
} as const;

export type SessionStatus =
  (typeof SessionStatuses)[keyof typeof SessionStatuses];

export function isSessionStatus(value: unknown): value is SessionStatus {
  return Object.values(SessionStatuses).includes(value as SessionStatus);
}

export function createSessionStatus(
  value: string,
): Result<SessionStatus, ValidationError> {
  if (!isSessionStatus(value)) {
    return err(Errors.validation("無効なセッションステータスです", "status"));
  }
  return ok(value);
}

// ========================================
// Triggered Event (共鳴イベント)
// ========================================

/**
 * 共鳴イベントの優先度
 */
export const EventPriorities = {
  HIGH: "high",
  NORMAL: "normal",
} as const;

export type EventPriority =
  (typeof EventPriorities)[keyof typeof EventPriorities];

/**
 * 発火した共鳴イベント
 *
 * キャラクターの過去とダンジョンの共鳴トリガーがマッチした結果
 */
export interface TriggeredEvent {
  /** 対象キャラクター名 */
  readonly characterName: string;
  /** 対象キャラクターID */
  readonly characterId: CharacterId;
  /** マッチした断片カテゴリ */
  readonly fragmentCategory: FragmentCategory;
  /** イベント効果の説明 */
  readonly effect: string;
  /** 優先度 */
  readonly priority: EventPriority;
}

// ========================================
// Session Structure (プロット骨子)
// ========================================

/**
 * シーン構造（プロット段階）
 */
export interface PlotScene {
  /** シーン番号 */
  readonly number: number;
  /** シーンタイトル */
  readonly title: string;
  /** シーンの概要 */
  readonly summary: string;
  /** フォーカスするキャラクター */
  readonly characterFocus: string | null;
  /** 共鳴イベントの発火（あれば） */
  readonly triggeredResonance: string | null;
}

/**
 * セッション構造（プロット骨子）
 *
 * LLMが生成する物語の設計図
 */
export interface SessionStructure {
  /** 導入 */
  readonly opening: {
    readonly scene: string;
    readonly partyDynamic: string;
    readonly hook: string;
  };
  /** シーン一覧 */
  readonly scenes: readonly PlotScene[];
  /** 核心 */
  readonly climax: {
    readonly confrontation: string;
    readonly choiceBearer: string;
    readonly resonancePayoff: string | null;
  };
  /** 結末 */
  readonly resolution: {
    readonly outcome: string;
    readonly cost: string;
    readonly changed: string;
  };
}

// ========================================
// Session Entity
// ========================================

/**
 * セッションエンティティ
 *
 * パーティ編成とダンジョン選択後のセッション生成状態を管理
 */
export interface Session {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly dungeonId: DungeonId;
  /** パーティメンバー（2-4人） */
  readonly party: readonly CharacterId[];
  readonly status: SessionStatus;
  /** 発火した共鳴イベント */
  readonly triggeredEvents: readonly TriggeredEvent[];
  /** 生成されたプロット構造 */
  readonly structure: SessionStructure | null;
  /** 生成されたリプレイID（完了時のみ） */
  readonly replayId: ReplayId | null;
  /** エラーメッセージ（失敗時のみ） */
  readonly errorMessage: string | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

// ========================================
// Session Summary (一覧表示用)
// ========================================

/**
 * セッションサマリ（一覧表示用）
 */
export interface SessionSummary {
  readonly id: SessionId;
  readonly dungeonName: string;
  readonly dungeonAlias: string;
  readonly partySize: number;
  readonly status: SessionStatus;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

// ========================================
// Party Size Validation
// ========================================

const MIN_PARTY_SIZE = 2;
const MAX_PARTY_SIZE = 4;

export { MIN_PARTY_SIZE, MAX_PARTY_SIZE };

/**
 * パーティサイズのバリデーション
 */
export function validatePartySize(
  party: readonly CharacterId[],
): Result<readonly CharacterId[], ValidationError> {
  if (party.length < MIN_PARTY_SIZE) {
    return err(
      Errors.validation(`パーティは${MIN_PARTY_SIZE}人以上必要です`, "party"),
    );
  }
  if (party.length > MAX_PARTY_SIZE) {
    return err(
      Errors.validation(
        `パーティは${MAX_PARTY_SIZE}人以下にしてください`,
        "party",
      ),
    );
  }
  // 重複チェック
  const uniqueIds = new Set(party);
  if (uniqueIds.size !== party.length) {
    return err(
      Errors.validation("パーティに重複するキャラクターがいます", "party"),
    );
  }
  return ok(party);
}

// ========================================
// Type Guards
// ========================================

export function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.userId === "string" &&
    typeof obj.dungeonId === "string" &&
    Array.isArray(obj.party) &&
    isSessionStatus(obj.status)
  );
}

export function isTriggeredEvent(value: unknown): value is TriggeredEvent {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.characterName === "string" &&
    typeof obj.characterId === "string" &&
    typeof obj.fragmentCategory === "string" &&
    typeof obj.effect === "string" &&
    (obj.priority === "high" || obj.priority === "normal")
  );
}

// ========================================
// Session Factory
// ========================================

export interface CreateSessionInput {
  readonly id: SessionId;
  readonly userId: UserId;
  readonly dungeonId: DungeonId;
  readonly party: readonly CharacterId[];
}

/**
 * 新規セッションを作成
 */
export function createSession(
  input: CreateSessionInput,
): Result<Session, ValidationError> {
  const partyResult = validatePartySize(input.party);
  if (partyResult.isErr()) {
    return err(partyResult.error);
  }

  const session: Session = {
    id: input.id,
    userId: input.userId,
    dungeonId: input.dungeonId,
    party: input.party,
    status: SessionStatuses.PENDING,
    triggeredEvents: [],
    structure: null,
    replayId: null,
    errorMessage: null,
    createdAt: new Date(),
    completedAt: null,
  };

  return ok(session);
}
