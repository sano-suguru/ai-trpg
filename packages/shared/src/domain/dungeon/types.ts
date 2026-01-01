/**
 * ダンジョン集約型定義
 *
 * ダンジョンは「キャラの傷を抉り、問いに答えを迫る場所」として設計
 * 単なる「モンスターがいる洞窟」ではなく、物語の触媒として機能する
 */

import { Result, ok, err } from "neverthrow";
import { Brand, asBrand } from "../../lib/brand";
import { Errors, ValidationError } from "../../types/errors";
import { DungeonId, UserId } from "../primitives/ids";
import { FragmentCategory } from "../character/fragments";

// ========================================
// Dungeon Value Objects
// ========================================

/** ダンジョン名 */
export type DungeonName = Brand<string, "DungeonName">;

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;

export function createDungeonName(
  value: string,
): Result<DungeonName, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length < NAME_MIN_LENGTH) {
    return err(Errors.validation("ダンジョン名は必須です", "name"));
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return err(
      Errors.validation(
        `ダンジョン名は${NAME_MAX_LENGTH}文字以内にしてください`,
        "name",
      ),
    );
  }

  return ok(asBrand<"DungeonName">(trimmed));
}

/** ダンジョン異名（別称） */
export type DungeonAlias = Brand<string, "DungeonAlias">;

const ALIAS_MAX_LENGTH = 200;

export function createDungeonAlias(
  value: string,
): Result<DungeonAlias, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length > ALIAS_MAX_LENGTH) {
    return err(
      Errors.validation(
        `異名は${ALIAS_MAX_LENGTH}文字以内にしてください`,
        "alias",
      ),
    );
  }

  return ok(asBrand<"DungeonAlias">(trimmed));
}

// ========================================
// Difficulty Tone
// ========================================

/**
 * 難易度トーン
 */
export const DifficultyTones = {
  /** 軽い - 初心者向け、ほのぼの */
  LIGHT: "light",
  /** 普通 - 標準的な難易度 */
  NORMAL: "normal",
  /** 重い - シリアス、緊張感 */
  HEAVY: "heavy",
  /** 絶望的 - 極めて危険、生存率低 */
  DESPERATE: "desperate",
} as const;

export type DifficultyTone =
  (typeof DifficultyTones)[keyof typeof DifficultyTones];

export function isDifficultyTone(value: unknown): value is DifficultyTone {
  return (
    value === "light" ||
    value === "normal" ||
    value === "heavy" ||
    value === "desperate"
  );
}

export function createDifficultyTone(
  value: string,
): Result<DifficultyTone, ValidationError> {
  if (!isDifficultyTone(value)) {
    return err(
      Errors.validation(
        "無効な難易度トーンです。light, normal, heavy, desperate のいずれかを指定してください",
        "difficultyTone",
      ),
    );
  }
  return ok(value);
}

// ========================================
// Trial Types
// ========================================

/**
 * 試練タイプ
 */
export const TrialTypes = {
  /** 戦闘 - 明確な敵との対峙 */
  COMBAT: "combat",
  /** 探索 - 隠された道、秘密の発見 */
  EXPLORATION: "exploration",
  /** 謎解き - 仕掛け、暗号、象徴の解読 */
  PUZZLE: "puzzle",
  /** 道徳選択 - 正解のない問い */
  MORAL_CHOICE: "moral_choice",
  /** 内面対峙 - キャラの過去/傷に向き合う */
  INNER_CONFRONTATION: "inner_confrontation",
  /** 生存 - 資源管理、時間制限、脱出 */
  SURVIVAL: "survival",
  /** 交渉 - 敵対者/存在との対話 */
  NEGOTIATION: "negotiation",
} as const;

export type TrialType = (typeof TrialTypes)[keyof typeof TrialTypes];

export function isTrialType(value: unknown): value is TrialType {
  return (
    value === "combat" ||
    value === "exploration" ||
    value === "puzzle" ||
    value === "moral_choice" ||
    value === "inner_confrontation" ||
    value === "survival" ||
    value === "negotiation"
  );
}

// ========================================
// Core Nature
// ========================================

/**
 * 核心の性質
 */
export const CoreNatures = {
  /** 選択 - 複数の選択肢から選ぶ */
  CHOICE: "choice",
  /** 対決 - 敵との最終対決 */
  CONFRONTATION: "confrontation",
  /** 発見 - 真実や秘密の発見 */
  DISCOVERY: "discovery",
  /** 喪失 - 何かを失う */
  LOSS: "loss",
  /** 解放 - 何かからの解放 */
  LIBERATION: "liberation",
} as const;

export type CoreNature = (typeof CoreNatures)[keyof typeof CoreNatures];

export function isCoreNature(value: unknown): value is CoreNature {
  return (
    value === "choice" ||
    value === "confrontation" ||
    value === "discovery" ||
    value === "loss" ||
    value === "liberation"
  );
}

export function createCoreNature(
  value: string,
): Result<CoreNature, ValidationError> {
  if (!isCoreNature(value)) {
    return err(
      Errors.validation(
        "無効な核心の性質です。choice, confrontation, discovery, loss, liberation のいずれかを指定してください",
        "core.nature",
      ),
    );
  }
  return ok(value);
}

// ========================================
// Dungeon Lore (3つの時間軸で語る)
// ========================================

/**
 * ダンジョンのロア（3つの時間軸）
 */
export interface DungeonLore {
  /** かつての姿 - 過去の栄光や平和な時代 */
  readonly past: string;
  /** 堕落の経緯 - 何が起きてこうなったか */
  readonly fall: string;
  /** 現在の状態 - 今はどうなっているか */
  readonly now: string;
}

const LORE_MAX_LENGTH = 1000;

export function createDungeonLore(input: {
  past: string;
  fall: string;
  now: string;
}): Result<DungeonLore, ValidationError> {
  if (input.past.length > LORE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `過去のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
        "lore.past",
      ),
    );
  }
  if (input.fall.length > LORE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `堕落のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
        "lore.fall",
      ),
    );
  }
  if (input.now.length > LORE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `現在のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
        "lore.now",
      ),
    );
  }

  return ok({
    past: input.past.trim(),
    fall: input.fall.trim(),
    now: input.now.trim(),
  });
}

// ========================================
// Dungeon Layer (層構造)
// ========================================

/**
 * ダンジョンの層（レイヤー）
 */
export interface DungeonLayer {
  /** 層の名前（例: "外縁 - 沈黙の参道"） */
  readonly name: string;
  /** 雰囲気の描写 */
  readonly atmosphere: string;
  /** 発生しうるイベント */
  readonly possibleEvents: readonly string[];
}

const LAYER_NAME_MAX_LENGTH = 100;
const LAYER_ATMOSPHERE_MAX_LENGTH = 500;
const LAYER_EVENT_MAX_LENGTH = 200;
const MAX_EVENTS_PER_LAYER = 10;

export function createDungeonLayer(input: {
  name: string;
  atmosphere: string;
  possibleEvents: readonly string[];
}): Result<DungeonLayer, ValidationError> {
  if (input.name.trim().length === 0) {
    return err(Errors.validation("層の名前は必須です", "layer.name"));
  }
  if (input.name.length > LAYER_NAME_MAX_LENGTH) {
    return err(
      Errors.validation(
        `層の名前は${LAYER_NAME_MAX_LENGTH}文字以内にしてください`,
        "layer.name",
      ),
    );
  }
  if (input.atmosphere.length > LAYER_ATMOSPHERE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `雰囲気は${LAYER_ATMOSPHERE_MAX_LENGTH}文字以内にしてください`,
        "layer.atmosphere",
      ),
    );
  }
  if (input.possibleEvents.length > MAX_EVENTS_PER_LAYER) {
    return err(
      Errors.validation(
        `イベントは${MAX_EVENTS_PER_LAYER}個以内にしてください`,
        "layer.possibleEvents",
      ),
    );
  }
  for (const event of input.possibleEvents) {
    if (event.length > LAYER_EVENT_MAX_LENGTH) {
      return err(
        Errors.validation(
          `イベントは${LAYER_EVENT_MAX_LENGTH}文字以内にしてください`,
          "layer.possibleEvents",
        ),
      );
    }
  }

  return ok({
    name: input.name.trim(),
    atmosphere: input.atmosphere.trim(),
    possibleEvents: input.possibleEvents.map((e) => e.trim()),
  });
}

// ========================================
// Dungeon Core (核心)
// ========================================

/**
 * ダンジョンの核心（クライマックス）
 */
export interface DungeonCore {
  /** 核心の性質 */
  readonly nature: CoreNature;
  /** 核心の描写 */
  readonly description: string;
  /** 可能な結末 */
  readonly possibleOutcomes: readonly string[];
}

const CORE_DESCRIPTION_MAX_LENGTH = 1000;
const OUTCOME_MAX_LENGTH = 300;
const MAX_OUTCOMES = 10;

export function createDungeonCore(input: {
  nature: string;
  description: string;
  possibleOutcomes: readonly string[];
}): Result<DungeonCore, ValidationError> {
  const natureResult = createCoreNature(input.nature);
  if (natureResult.isErr()) return err(natureResult.error);

  if (input.description.length > CORE_DESCRIPTION_MAX_LENGTH) {
    return err(
      Errors.validation(
        `核心の描写は${CORE_DESCRIPTION_MAX_LENGTH}文字以内にしてください`,
        "core.description",
      ),
    );
  }
  if (input.possibleOutcomes.length === 0) {
    return err(
      Errors.validation("結末は最低1つ必要です", "core.possibleOutcomes"),
    );
  }
  if (input.possibleOutcomes.length > MAX_OUTCOMES) {
    return err(
      Errors.validation(
        `結末は${MAX_OUTCOMES}個以内にしてください`,
        "core.possibleOutcomes",
      ),
    );
  }
  for (const outcome of input.possibleOutcomes) {
    if (outcome.length > OUTCOME_MAX_LENGTH) {
      return err(
        Errors.validation(
          `結末は${OUTCOME_MAX_LENGTH}文字以内にしてください`,
          "core.possibleOutcomes",
        ),
      );
    }
  }

  return ok({
    nature: natureResult.value,
    description: input.description.trim(),
    possibleOutcomes: input.possibleOutcomes.map((o) => o.trim()),
  });
}

// ========================================
// Resonance Trigger (共鳴トリガー)
// ========================================

/**
 * 共鳴トリガー
 *
 * キャラクターの断片とダンジョンが「共鳴」すると、特別なイベントが発生
 */
export interface ResonanceTrigger {
  /** 対象の断片カテゴリ */
  readonly fragmentType: FragmentCategory;
  /** マッチするキーワード */
  readonly keywords: readonly string[];
  /** 発動時の効果描写 */
  readonly effect: string;
}

const KEYWORD_MAX_LENGTH = 50;
const MAX_KEYWORDS = 10;
const EFFECT_MAX_LENGTH = 500;

export function createResonanceTrigger(input: {
  fragmentType: FragmentCategory;
  keywords: readonly string[];
  effect: string;
}): Result<ResonanceTrigger, ValidationError> {
  if (input.keywords.length === 0) {
    return err(
      Errors.validation("キーワードは最低1つ必要です", "resonance.keywords"),
    );
  }
  if (input.keywords.length > MAX_KEYWORDS) {
    return err(
      Errors.validation(
        `キーワードは${MAX_KEYWORDS}個以内にしてください`,
        "resonance.keywords",
      ),
    );
  }
  for (const keyword of input.keywords) {
    if (keyword.length > KEYWORD_MAX_LENGTH) {
      return err(
        Errors.validation(
          `キーワードは${KEYWORD_MAX_LENGTH}文字以内にしてください`,
          "resonance.keywords",
        ),
      );
    }
  }
  if (input.effect.trim().length === 0) {
    return err(Errors.validation("効果の描写は必須です", "resonance.effect"));
  }
  if (input.effect.length > EFFECT_MAX_LENGTH) {
    return err(
      Errors.validation(
        `効果の描写は${EFFECT_MAX_LENGTH}文字以内にしてください`,
        "resonance.effect",
      ),
    );
  }

  return ok({
    fragmentType: input.fragmentType,
    keywords: input.keywords.map((k) => k.trim()),
    effect: input.effect.trim(),
  });
}

// ========================================
// Dungeon Entity
// ========================================

/**
 * ダンジョンエンティティ
 */
export interface Dungeon {
  readonly _tag: "Dungeon";
  readonly id: DungeonId;
  readonly authorId: UserId;
  readonly name: DungeonName;
  readonly alias: DungeonAlias;
  readonly layerCount: number;
  readonly recommendedParty: string;
  readonly difficultyTone: DifficultyTone;
  readonly tags: readonly string[];
  readonly trialTypes: readonly TrialType[];
  readonly lore: DungeonLore;
  readonly layers: readonly DungeonLayer[];
  readonly core: DungeonCore;
  readonly resonance: readonly ResonanceTrigger[];
  readonly isPublic: boolean;
  readonly playCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ========================================
// Dungeon Summary (for lists)
// ========================================

/**
 * ダンジョン一覧用のサマリ型
 */
export interface DungeonSummary {
  readonly id: DungeonId;
  readonly name: DungeonName;
  readonly alias: DungeonAlias;
  readonly layerCount: number;
  readonly difficultyTone: DifficultyTone;
  readonly tags: readonly string[];
  readonly trialTypes: readonly TrialType[];
  readonly isPublic: boolean;
  readonly playCount: number;
}

/**
 * DungeonからSummaryを生成
 */
export function toDungeonSummary(dungeon: Dungeon): DungeonSummary {
  return {
    id: dungeon.id,
    name: dungeon.name,
    alias: dungeon.alias,
    layerCount: dungeon.layerCount,
    difficultyTone: dungeon.difficultyTone,
    tags: dungeon.tags,
    trialTypes: dungeon.trialTypes,
    isPublic: dungeon.isPublic,
    playCount: dungeon.playCount,
  };
}

// ========================================
// Type Guards
// ========================================

export function isDungeon(value: unknown): value is Dungeon {
  return (
    typeof value === "object" &&
    value !== null &&
    "_tag" in value &&
    (value as Dungeon)._tag === "Dungeon"
  );
}
