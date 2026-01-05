/**
 * リプレイ集約型定義
 *
 * セッション生成結果としてのリプレイを表現
 * design.mdのリプレイ出力形式に準拠
 */

import { Result, ok, err } from "neverthrow";
import { Errors, ValidationError } from "../../types/errors";
import { SessionId, ReplayId, CharacterId } from "../primitives/ids";

// ========================================
// Outcome Types (結末タイプ)
// ========================================

/**
 * 結末タイプ
 */
export const OutcomeTypes = {
  /** 解放 */
  LIBERATION: "liberation",
  /** 喪失 */
  LOSS: "loss",
  /** 発見 */
  DISCOVERY: "discovery",
  /** 選択 */
  CHOICE: "choice",
  /** 対決 */
  CONFRONTATION: "confrontation",
} as const;

export type OutcomeType = (typeof OutcomeTypes)[keyof typeof OutcomeTypes];

export function isOutcomeType(value: unknown): value is OutcomeType {
  return Object.values(OutcomeTypes).includes(value as OutcomeType);
}

export function createOutcomeType(
  value: string,
): Result<OutcomeType, ValidationError> {
  if (!isOutcomeType(value)) {
    return err(Errors.validation("無効な結末タイプです", "outcomeType"));
  }
  return ok(value);
}

// ========================================
// Replay Header
// ========================================

/**
 * パーティメンバー情報（ヘッダー表示用）
 */
export interface PartyMemberInfo {
  readonly id: CharacterId;
  readonly name: string;
  readonly title: string;
}

/**
 * リプレイヘッダー
 */
export interface ReplayHeader {
  /** ダンジョン名 */
  readonly dungeonName: string;
  /** ダンジョン異名 */
  readonly dungeonAlias: string;
  /** パーティ情報 */
  readonly party: readonly PartyMemberInfo[];
  /** 到達深度（層数） */
  readonly depthReached: number;
  /** 結末タイプ */
  readonly outcomeType: OutcomeType;
}

// ========================================
// Scene
// ========================================

/**
 * シーン（リプレイ本文）
 */
export interface Scene {
  /** シーン番号（1始まり） */
  readonly number: number;
  /** シーンタイトル */
  readonly title: string;
  /** シーン本文（400-600字） */
  readonly text: string;
}

/**
 * シーンのバリデーション
 */
export function validateScene(scene: Scene): Result<Scene, ValidationError> {
  if (scene.number < 1) {
    return err(
      Errors.validation("シーン番号は1以上である必要があります", "number"),
    );
  }
  if (!scene.title.trim()) {
    return err(Errors.validation("シーンタイトルは必須です", "title"));
  }
  if (!scene.text.trim()) {
    return err(Errors.validation("シーン本文は必須です", "text"));
  }
  return ok(scene);
}

// ========================================
// Character Change (キャラクター変化)
// ========================================

/**
 * キャラクター変化タイプ
 */
export const ChangeTypes = {
  /** 傷・負傷 */
  WOUND: "wound",
  /** 内面の変化 */
  INNER: "inner",
  /** 関係性 */
  RELATIONSHIP: "relationship",
  /** 状態変化なし */
  UNCHANGED: "unchanged",
} as const;

export type ChangeType = (typeof ChangeTypes)[keyof typeof ChangeTypes];

/**
 * キャラクター変化記録
 */
export interface CharacterChange {
  readonly characterId: CharacterId;
  readonly characterName: string;
  readonly changeType: ChangeType;
  /** 変化の説明 */
  readonly description: string;
}

// ========================================
// Replay Footer
// ========================================

/**
 * リプレイフッター
 */
export interface ReplayFooter {
  /** セッション日付（ゲーム内暦） */
  readonly sessionDate: string;
  /** 生存者数 */
  readonly survivors: string;
  /** キャラクター変化一覧 */
  readonly characterChanges: readonly CharacterChange[];
}

// ========================================
// Replay Entity
// ========================================

/**
 * リプレイエンティティ
 *
 * セッション生成の最終成果物
 */
export interface Replay {
  readonly id: ReplayId;
  readonly sessionId: SessionId;
  /** ヘッダー情報 */
  readonly header: ReplayHeader;
  /** 導入詩/エピグラフ */
  readonly epigraph: string;
  /** シーン一覧 */
  readonly scenes: readonly Scene[];
  /** エピローグ */
  readonly epilogue: string;
  /** フッター情報 */
  readonly footer: ReplayFooter;
  /** 総文字数 */
  readonly totalCharCount: number;
  readonly createdAt: Date;
}

// ========================================
// Replay Summary (一覧表示用)
// ========================================

/**
 * リプレイサマリ（一覧表示用）
 */
export interface ReplaySummary {
  readonly id: ReplayId;
  readonly sessionId: SessionId;
  readonly dungeonName: string;
  readonly dungeonAlias: string;
  readonly outcomeType: OutcomeType;
  readonly partySize: number;
  readonly sceneCount: number;
  readonly totalCharCount: number;
  readonly createdAt: Date;
}

// ========================================
// Type Guards
// ========================================

export function isReplay(value: unknown): value is Replay {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.sessionId === "string" &&
    typeof obj.header === "object" &&
    typeof obj.epigraph === "string" &&
    Array.isArray(obj.scenes) &&
    typeof obj.epilogue === "string" &&
    typeof obj.footer === "object"
  );
}

export function isScene(value: unknown): value is Scene {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.number === "number" &&
    typeof obj.title === "string" &&
    typeof obj.text === "string"
  );
}

// ========================================
// Replay Factory
// ========================================

export interface CreateReplayInput {
  readonly id: ReplayId;
  readonly sessionId: SessionId;
  readonly header: ReplayHeader;
  readonly epigraph: string;
  readonly scenes: readonly Scene[];
  readonly epilogue: string;
  readonly footer: ReplayFooter;
}

/**
 * 新規リプレイを作成
 */
export function createReplay(
  input: CreateReplayInput,
): Result<Replay, ValidationError> {
  // シーンのバリデーション
  for (const scene of input.scenes) {
    const result = validateScene(scene);
    if (result.isErr()) {
      return err(result.error);
    }
  }

  // シーン数チェック（5-8シーン）
  if (input.scenes.length < 5) {
    return err(Errors.validation("リプレイは最低5シーン必要です", "scenes"));
  }
  if (input.scenes.length > 10) {
    return err(Errors.validation("リプレイは最大10シーンまでです", "scenes"));
  }

  // エピグラフチェック
  if (!input.epigraph.trim()) {
    return err(Errors.validation("エピグラフは必須です", "epigraph"));
  }

  // エピローグチェック
  if (!input.epilogue.trim()) {
    return err(Errors.validation("エピローグは必須です", "epilogue"));
  }

  // 総文字数を計算
  const totalCharCount = calculateTotalCharCount(input);

  const replay: Replay = {
    id: input.id,
    sessionId: input.sessionId,
    header: input.header,
    epigraph: input.epigraph,
    scenes: input.scenes,
    epilogue: input.epilogue,
    footer: input.footer,
    totalCharCount,
    createdAt: new Date(),
  };

  return ok(replay);
}

/**
 * 総文字数を計算
 */
function calculateTotalCharCount(input: CreateReplayInput): number {
  let count = 0;
  count += input.epigraph.length;
  for (const scene of input.scenes) {
    count += scene.title.length;
    count += scene.text.length;
  }
  count += input.epilogue.length;
  return count;
}

// ========================================
// Conversion Functions
// ========================================

/**
 * リプレイをサマリに変換
 */
export function toReplaySummary(replay: Replay): ReplaySummary {
  return {
    id: replay.id,
    sessionId: replay.sessionId,
    dungeonName: replay.header.dungeonName,
    dungeonAlias: replay.header.dungeonAlias,
    outcomeType: replay.header.outcomeType,
    partySize: replay.header.party.length,
    sceneCount: replay.scenes.length,
    totalCharCount: replay.totalCharCount,
    createdAt: replay.createdAt,
  };
}
