/**
 * ダンジョンドメイン操作（純粋関数）
 *
 * ダンジョンの状態変更を行う純粋関数群
 * 全ての操作は新しいオブジェクトを返し、元のオブジェクトは変更しない
 */

import { Result, ok, err } from "neverthrow";
import { Errors, ValidationError } from "../../types/errors";
import { DungeonId, UserId } from "../primitives/ids";
import { FragmentCategory } from "../character/fragments";
import {
  Dungeon,
  DungeonLayer,
  ResonanceTrigger,
  TrialType,
  DifficultyTone,
  createDungeonName,
  createDungeonAlias,
  createDifficultyTone,
  createDungeonLore,
  createDungeonLayer,
  createDungeonCore,
  createResonanceTrigger,
  isTrialType,
} from "./types";

// ========================================
// Dungeon Creation
// ========================================

/**
 * 新規ダンジョン作成用の入力型
 */
export interface CreateDungeonInput {
  readonly name: string;
  readonly alias?: string;
  readonly recommendedParty?: string;
  readonly difficultyTone?: string;
  readonly tags?: readonly string[];
  readonly trialTypes?: readonly string[];
  readonly lore: {
    readonly past: string;
    readonly fall: string;
    readonly now: string;
  };
  readonly layers: readonly {
    readonly name: string;
    readonly atmosphere: string;
    readonly possibleEvents: readonly string[];
  }[];
  readonly core: {
    readonly nature: string;
    readonly description: string;
    readonly possibleOutcomes: readonly string[];
  };
  readonly resonance?: readonly {
    readonly fragmentType: FragmentCategory;
    readonly keywords: readonly string[];
    readonly effect: string;
  }[];
  readonly isPublic?: boolean;
}

const TAG_MAX_LENGTH = 50;
const MAX_TAGS = 20;
const MAX_LAYERS = 10;
const MAX_RESONANCE = 20;

/**
 * ダンジョン作成（バリデーション付き）
 */
export function createDungeon(
  id: DungeonId,
  authorId: UserId,
  input: CreateDungeonInput,
): Result<Dungeon, ValidationError> {
  // Name
  const nameResult = createDungeonName(input.name);
  if (nameResult.isErr()) return err(nameResult.error);

  // Alias
  const aliasResult = createDungeonAlias(input.alias ?? "");
  if (aliasResult.isErr()) return err(aliasResult.error);

  // Difficulty Tone
  const difficultyToneResult = createDifficultyTone(
    input.difficultyTone ?? "normal",
  );
  if (difficultyToneResult.isErr()) return err(difficultyToneResult.error);

  // Tags
  const tags = input.tags ?? [];
  if (tags.length > MAX_TAGS) {
    return err(
      Errors.validation(`タグは${MAX_TAGS}個以内にしてください`, "tags"),
    );
  }
  for (const tag of tags) {
    if (tag.length > TAG_MAX_LENGTH) {
      return err(
        Errors.validation(
          `タグは${TAG_MAX_LENGTH}文字以内にしてください`,
          "tags",
        ),
      );
    }
  }

  // Trial Types
  const trialTypes: TrialType[] = [];
  for (const t of input.trialTypes ?? []) {
    if (!isTrialType(t)) {
      return err(Errors.validation(`無効な試練タイプです: ${t}`, "trialTypes"));
    }
    trialTypes.push(t);
  }

  // Lore
  const loreResult = createDungeonLore(input.lore);
  if (loreResult.isErr()) return err(loreResult.error);

  // Layers
  if (input.layers.length === 0) {
    return err(Errors.validation("層は最低1つ必要です", "layers"));
  }
  if (input.layers.length > MAX_LAYERS) {
    return err(
      Errors.validation(`層は${MAX_LAYERS}個以内にしてください`, "layers"),
    );
  }
  const layers: DungeonLayer[] = [];
  for (let i = 0; i < input.layers.length; i++) {
    const layerResult = createDungeonLayer(input.layers[i]);
    if (layerResult.isErr()) {
      return err(
        Errors.validation(
          layerResult.error.message,
          `layers[${i}].${layerResult.error.field}`,
        ),
      );
    }
    layers.push(layerResult.value);
  }

  // Core
  const coreResult = createDungeonCore(input.core);
  if (coreResult.isErr()) return err(coreResult.error);

  // Resonance
  const resonanceInput = input.resonance ?? [];
  if (resonanceInput.length > MAX_RESONANCE) {
    return err(
      Errors.validation(
        `共鳴トリガーは${MAX_RESONANCE}個以内にしてください`,
        "resonance",
      ),
    );
  }
  const resonance: ResonanceTrigger[] = [];
  for (let i = 0; i < resonanceInput.length; i++) {
    const resonanceResult = createResonanceTrigger(resonanceInput[i]);
    if (resonanceResult.isErr()) {
      return err(
        Errors.validation(
          resonanceResult.error.message,
          `resonance[${i}].${resonanceResult.error.field}`,
        ),
      );
    }
    resonance.push(resonanceResult.value);
  }

  const now = new Date();

  return ok({
    _tag: "Dungeon",
    id,
    authorId,
    name: nameResult.value,
    alias: aliasResult.value,
    layerCount: layers.length,
    recommendedParty: input.recommendedParty ?? "2〜4人",
    difficultyTone: difficultyToneResult.value,
    tags: tags.map((t) => t.trim()),
    trialTypes,
    lore: loreResult.value,
    layers,
    core: coreResult.value,
    resonance,
    isPublic: input.isPublic ?? false,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// Dungeon Update
// ========================================

/**
 * ダンジョン更新用の入力型
 */
export interface UpdateDungeonInput {
  readonly name?: string;
  readonly alias?: string;
  readonly recommendedParty?: string;
  readonly difficultyTone?: string;
  readonly tags?: readonly string[];
  readonly trialTypes?: readonly string[];
  readonly lore?: {
    readonly past: string;
    readonly fall: string;
    readonly now: string;
  };
  readonly layers?: readonly {
    readonly name: string;
    readonly atmosphere: string;
    readonly possibleEvents: readonly string[];
  }[];
  readonly core?: {
    readonly nature: string;
    readonly description: string;
    readonly possibleOutcomes: readonly string[];
  };
  readonly resonance?: readonly {
    readonly fragmentType: FragmentCategory;
    readonly keywords: readonly string[];
    readonly effect: string;
  }[];
  readonly isPublic?: boolean;
}

/**
 * ダンジョンを更新
 */
export function updateDungeon(
  dungeon: Dungeon,
  input: UpdateDungeonInput,
): Result<Dungeon, ValidationError> {
  let newName = dungeon.name;
  let newAlias = dungeon.alias;
  let newRecommendedParty = dungeon.recommendedParty;
  let newDifficultyTone = dungeon.difficultyTone;
  let newTags = dungeon.tags;
  let newTrialTypes = dungeon.trialTypes;
  let newLore = dungeon.lore;
  let newLayers = dungeon.layers;
  let newCore = dungeon.core;
  let newResonance = dungeon.resonance;
  let newIsPublic = dungeon.isPublic;

  if (input.name !== undefined) {
    const result = createDungeonName(input.name);
    if (result.isErr()) return err(result.error);
    newName = result.value;
  }

  if (input.alias !== undefined) {
    const result = createDungeonAlias(input.alias);
    if (result.isErr()) return err(result.error);
    newAlias = result.value;
  }

  if (input.recommendedParty !== undefined) {
    newRecommendedParty = input.recommendedParty;
  }

  if (input.difficultyTone !== undefined) {
    const result = createDifficultyTone(input.difficultyTone);
    if (result.isErr()) return err(result.error);
    newDifficultyTone = result.value;
  }

  if (input.tags !== undefined) {
    if (input.tags.length > MAX_TAGS) {
      return err(
        Errors.validation(`タグは${MAX_TAGS}個以内にしてください`, "tags"),
      );
    }
    for (const tag of input.tags) {
      if (tag.length > TAG_MAX_LENGTH) {
        return err(
          Errors.validation(
            `タグは${TAG_MAX_LENGTH}文字以内にしてください`,
            "tags",
          ),
        );
      }
    }
    newTags = input.tags.map((t) => t.trim());
  }

  if (input.trialTypes !== undefined) {
    const types: TrialType[] = [];
    for (const t of input.trialTypes) {
      if (!isTrialType(t)) {
        return err(
          Errors.validation(`無効な試練タイプです: ${t}`, "trialTypes"),
        );
      }
      types.push(t);
    }
    newTrialTypes = types;
  }

  if (input.lore !== undefined) {
    const result = createDungeonLore(input.lore);
    if (result.isErr()) return err(result.error);
    newLore = result.value;
  }

  if (input.layers !== undefined) {
    if (input.layers.length === 0) {
      return err(Errors.validation("層は最低1つ必要です", "layers"));
    }
    if (input.layers.length > MAX_LAYERS) {
      return err(
        Errors.validation(`層は${MAX_LAYERS}個以内にしてください`, "layers"),
      );
    }
    const layers: DungeonLayer[] = [];
    for (let i = 0; i < input.layers.length; i++) {
      const layerResult = createDungeonLayer(input.layers[i]);
      if (layerResult.isErr()) {
        return err(
          Errors.validation(
            layerResult.error.message,
            `layers[${i}].${layerResult.error.field}`,
          ),
        );
      }
      layers.push(layerResult.value);
    }
    newLayers = layers;
  }

  if (input.core !== undefined) {
    const result = createDungeonCore(input.core);
    if (result.isErr()) return err(result.error);
    newCore = result.value;
  }

  if (input.resonance !== undefined) {
    if (input.resonance.length > MAX_RESONANCE) {
      return err(
        Errors.validation(
          `共鳴トリガーは${MAX_RESONANCE}個以内にしてください`,
          "resonance",
        ),
      );
    }
    const resonance: ResonanceTrigger[] = [];
    for (let i = 0; i < input.resonance.length; i++) {
      const resonanceResult = createResonanceTrigger(input.resonance[i]);
      if (resonanceResult.isErr()) {
        return err(
          Errors.validation(
            resonanceResult.error.message,
            `resonance[${i}].${resonanceResult.error.field}`,
          ),
        );
      }
      resonance.push(resonanceResult.value);
    }
    newResonance = resonance;
  }

  if (input.isPublic !== undefined) {
    newIsPublic = input.isPublic;
  }

  return ok({
    ...dungeon,
    name: newName,
    alias: newAlias,
    recommendedParty: newRecommendedParty,
    difficultyTone: newDifficultyTone,
    tags: newTags,
    trialTypes: newTrialTypes,
    lore: newLore,
    layers: newLayers,
    layerCount: newLayers.length,
    core: newCore,
    resonance: newResonance,
    isPublic: newIsPublic,
    updatedAt: new Date(),
  });
}

// ========================================
// Play Count Operations
// ========================================

/**
 * プレイ回数をインクリメント
 */
export function incrementPlayCount(dungeon: Dungeon): Dungeon {
  return {
    ...dungeon,
    playCount: dungeon.playCount + 1,
    updatedAt: new Date(),
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * 難易度トーンのラベルを取得
 */
export function getDifficultyToneLabel(tone: DifficultyTone): string {
  const labels: Record<DifficultyTone, string> = {
    light: "軽い",
    normal: "普通",
    heavy: "重い",
    desperate: "絶望的",
  };
  return labels[tone];
}

/**
 * 試練タイプのラベルを取得
 */
export function getTrialTypeLabel(type: TrialType): string {
  const labels: Record<TrialType, string> = {
    combat: "戦闘",
    exploration: "探索",
    puzzle: "謎解き",
    moral_choice: "道徳選択",
    inner_confrontation: "内面対峙",
    survival: "生存",
    negotiation: "交渉",
  };
  return labels[type];
}

/**
 * 核心の性質のラベルを取得
 */
export function getCoreNatureLabel(nature: string): string {
  const labels: Record<string, string> = {
    choice: "選択",
    confrontation: "対決",
    discovery: "発見",
    loss: "喪失",
    liberation: "解放",
  };
  return labels[nature] ?? nature;
}
