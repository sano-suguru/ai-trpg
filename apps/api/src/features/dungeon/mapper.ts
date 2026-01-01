/**
 * Dungeon Mapper
 *
 * DB行とドメインモデル間の変換
 */

import { Result, ok, err } from "neverthrow";
import {
  Dungeon,
  DungeonLore,
  DungeonLayer,
  DungeonCore,
  ResonanceTrigger,
  TrialType,
  createDungeonName,
  createDungeonAlias,
  createDifficultyTone,
  UnsafeIds,
  isTrialType,
  isCoreNature,
} from "@ai-trpg/shared/domain";
import type { FragmentCategory } from "@ai-trpg/shared/domain";
import type { ValidationError } from "@ai-trpg/shared/types";
import { Errors } from "@ai-trpg/shared/types";
import type {
  DungeonRow,
  NewDungeonRow,
  DungeonLoreJson,
  DungeonLayerJson,
  DungeonCoreJson,
  ResonanceTriggerJson,
  TrialTypeJson,
} from "../../infrastructure/database/schema";

// ========================================
// DB Row → Domain Model
// ========================================

/**
 * DB行からドメインモデルへ変換
 */
export function toDomain(row: DungeonRow): Result<Dungeon, ValidationError> {
  const nameResult = createDungeonName(row.name);
  if (nameResult.isErr()) return err(nameResult.error);

  const aliasResult = createDungeonAlias(row.alias);
  if (aliasResult.isErr()) return err(aliasResult.error);

  const difficultyToneResult = createDifficultyTone(row.difficultyTone);
  if (difficultyToneResult.isErr()) return err(difficultyToneResult.error);

  // Validate trial types
  const trialTypes: TrialType[] = [];
  for (const t of row.trialTypes) {
    if (!isTrialType(t)) {
      return err(Errors.validation(`無効な試練タイプです: ${t}`, "trialTypes"));
    }
    trialTypes.push(t);
  }

  // Validate core nature
  if (!isCoreNature(row.core.nature)) {
    return err(
      Errors.validation(
        `無効な核心の性質です: ${row.core.nature}`,
        "core.nature",
      ),
    );
  }

  return ok({
    _tag: "Dungeon",
    id: UnsafeIds.dungeonId(row.id),
    authorId: UnsafeIds.userId(row.authorId),
    name: nameResult.value,
    alias: aliasResult.value,
    layerCount: row.layerCount,
    recommendedParty: row.recommendedParty,
    difficultyTone: difficultyToneResult.value,
    tags: row.tags,
    trialTypes,
    lore: jsonToLore(row.lore),
    layers: jsonToLayers(row.layers),
    core: jsonToCore(row.core),
    resonance: jsonToResonance(row.resonance),
    isPublic: row.isPublic,
    playCount: row.playCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

// ========================================
// Domain Model → DB Row
// ========================================

/**
 * ドメインモデルからDB行への変換（新規作成用）
 */
export function toNewRow(dungeon: Dungeon): NewDungeonRow {
  return {
    id: dungeon.id as string,
    authorId: dungeon.authorId as string,
    name: dungeon.name as string,
    alias: dungeon.alias as string,
    layerCount: dungeon.layerCount,
    recommendedParty: dungeon.recommendedParty,
    difficultyTone: dungeon.difficultyTone,
    tags: [...dungeon.tags],
    trialTypes: dungeon.trialTypes as TrialTypeJson[],
    lore: loreToJson(dungeon.lore),
    layers: layersToJson(dungeon.layers),
    core: coreToJson(dungeon.core),
    resonance: resonanceToJson(dungeon.resonance),
    isPublic: dungeon.isPublic,
    playCount: dungeon.playCount,
    createdAt: dungeon.createdAt,
    updatedAt: dungeon.updatedAt,
  };
}

/**
 * ドメインモデルからDB更新用の部分行への変換
 */
export function toUpdateRow(
  dungeon: Dungeon,
): Omit<NewDungeonRow, "id" | "authorId" | "createdAt"> {
  return {
    name: dungeon.name as string,
    alias: dungeon.alias as string,
    layerCount: dungeon.layerCount,
    recommendedParty: dungeon.recommendedParty,
    difficultyTone: dungeon.difficultyTone,
    tags: [...dungeon.tags],
    trialTypes: dungeon.trialTypes as TrialTypeJson[],
    lore: loreToJson(dungeon.lore),
    layers: layersToJson(dungeon.layers),
    core: coreToJson(dungeon.core),
    resonance: resonanceToJson(dungeon.resonance),
    isPublic: dungeon.isPublic,
    playCount: dungeon.playCount,
    updatedAt: dungeon.updatedAt,
  };
}

// ========================================
// JSON ⇔ Domain Helpers
// ========================================

function jsonToLore(json: DungeonLoreJson): DungeonLore {
  return {
    past: json.past,
    fall: json.fall,
    now: json.now,
  };
}

function loreToJson(lore: DungeonLore): DungeonLoreJson {
  return {
    past: lore.past,
    fall: lore.fall,
    now: lore.now,
  };
}

function jsonToLayers(json: DungeonLayerJson[]): readonly DungeonLayer[] {
  return json.map((l) => ({
    name: l.name,
    atmosphere: l.atmosphere,
    possibleEvents: l.possibleEvents,
  }));
}

function layersToJson(layers: readonly DungeonLayer[]): DungeonLayerJson[] {
  return layers.map((l) => ({
    name: l.name,
    atmosphere: l.atmosphere,
    possibleEvents: [...l.possibleEvents],
  }));
}

function jsonToCore(json: DungeonCoreJson): DungeonCore {
  return {
    nature: json.nature,
    description: json.description,
    possibleOutcomes: json.possibleOutcomes,
  };
}

function coreToJson(core: DungeonCore): DungeonCoreJson {
  return {
    nature: core.nature,
    description: core.description,
    possibleOutcomes: [...core.possibleOutcomes],
  };
}

function jsonToResonance(
  json: ResonanceTriggerJson[],
): readonly ResonanceTrigger[] {
  return json.map((r) => ({
    fragmentType: r.fragmentType as FragmentCategory,
    keywords: r.keywords,
    effect: r.effect,
  }));
}

function resonanceToJson(
  resonance: readonly ResonanceTrigger[],
): ResonanceTriggerJson[] {
  return resonance.map((r) => ({
    fragmentType: r.fragmentType as ResonanceTriggerJson["fragmentType"],
    keywords: [...r.keywords],
    effect: r.effect,
  }));
}
