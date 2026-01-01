/**
 * ダンジョンドメインモジュール
 *
 * @module domain/dungeon
 */

// Types
export type {
  DungeonName,
  DungeonAlias,
  DifficultyTone,
  TrialType,
  CoreNature,
  DungeonLore,
  DungeonLayer,
  DungeonCore,
  ResonanceTrigger,
  Dungeon,
  DungeonSummary,
} from "./types";

export {
  DifficultyTones,
  TrialTypes,
  CoreNatures,
  createDungeonName,
  createDungeonAlias,
  createDifficultyTone,
  createDungeonLore,
  createDungeonLayer,
  createDungeonCore,
  createResonanceTrigger,
  createCoreNature,
  isDifficultyTone,
  isTrialType,
  isCoreNature,
  isDungeon,
  toDungeonSummary,
} from "./types";

// Operations
export type { CreateDungeonInput, UpdateDungeonInput } from "./operations";

export {
  createDungeon,
  updateDungeon,
  incrementPlayCount,
  getDifficultyToneLabel,
  getTrialTypeLabel,
  getCoreNatureLabel,
} from "./operations";
