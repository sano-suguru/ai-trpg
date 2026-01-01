/**
 * ダンジョン関連のZodスキーマ
 *
 * API入力バリデーションに使用
 * ドメイン型とは別に定義し、バリデーションロジックを共有
 */

import { z } from "zod";
import { uuidSchema } from "./character";

// ========================================
// Constants (match domain model constraints)
// ========================================

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;
const ALIAS_MAX_LENGTH = 200;
const TAG_MAX_LENGTH = 50;
const MAX_TAGS = 20;
const LORE_MAX_LENGTH = 1000;
const LAYER_NAME_MAX_LENGTH = 100;
const LAYER_ATMOSPHERE_MAX_LENGTH = 500;
const LAYER_EVENT_MAX_LENGTH = 200;
const MAX_EVENTS_PER_LAYER = 10;
const MAX_LAYERS = 10;
const CORE_DESCRIPTION_MAX_LENGTH = 1000;
const OUTCOME_MAX_LENGTH = 300;
const MAX_OUTCOMES = 10;
const KEYWORD_MAX_LENGTH = 50;
const MAX_KEYWORDS = 10;
const EFFECT_MAX_LENGTH = 500;
const MAX_RESONANCE = 20;

/** ダンジョン名 */
export const dungeonNameSchema = z
  .string()
  .min(NAME_MIN_LENGTH, "ダンジョン名は必須です")
  .max(
    NAME_MAX_LENGTH,
    `ダンジョン名は${NAME_MAX_LENGTH}文字以内にしてください`,
  )
  .transform((v) => v.trim());

/** ダンジョン異名 */
export const dungeonAliasSchema = z
  .string()
  .max(ALIAS_MAX_LENGTH, `異名は${ALIAS_MAX_LENGTH}文字以内にしてください`)
  .transform((v) => v.trim());

/** 難易度トーン */
export const difficultyToneSchema = z.enum([
  "light",
  "normal",
  "heavy",
  "desperate",
]);

/** 試練タイプ */
export const trialTypeSchema = z.enum([
  "combat",
  "exploration",
  "puzzle",
  "moral_choice",
  "inner_confrontation",
  "survival",
  "negotiation",
]);

/** 核心の性質 */
export const coreNatureSchema = z.enum([
  "choice",
  "confrontation",
  "discovery",
  "loss",
  "liberation",
]);

/** 断片カテゴリ */
export const fragmentCategorySchema = z.enum([
  "origin",
  "loss",
  "mark",
  "sin",
  "quest",
  "trait",
]);

/** タグ */
export const tagSchema = z
  .string()
  .max(TAG_MAX_LENGTH, `タグは${TAG_MAX_LENGTH}文字以内にしてください`)
  .transform((v) => v.trim());

// ========================================
// Composite Schemas
// ========================================

/** ロア入力 */
export const loreInputSchema = z.object({
  past: z
    .string()
    .max(
      LORE_MAX_LENGTH,
      `過去のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
    ),
  fall: z
    .string()
    .max(
      LORE_MAX_LENGTH,
      `堕落のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
    ),
  now: z
    .string()
    .max(
      LORE_MAX_LENGTH,
      `現在のロアは${LORE_MAX_LENGTH}文字以内にしてください`,
    ),
});

/** 層入力 */
export const layerInputSchema = z.object({
  name: z
    .string()
    .min(1, "層の名前は必須です")
    .max(
      LAYER_NAME_MAX_LENGTH,
      `層の名前は${LAYER_NAME_MAX_LENGTH}文字以内にしてください`,
    )
    .transform((v) => v.trim()),
  atmosphere: z
    .string()
    .max(
      LAYER_ATMOSPHERE_MAX_LENGTH,
      `雰囲気は${LAYER_ATMOSPHERE_MAX_LENGTH}文字以内にしてください`,
    )
    .transform((v) => v.trim()),
  possibleEvents: z
    .array(
      z
        .string()
        .max(
          LAYER_EVENT_MAX_LENGTH,
          `イベントは${LAYER_EVENT_MAX_LENGTH}文字以内にしてください`,
        )
        .transform((v) => v.trim()),
    )
    .max(
      MAX_EVENTS_PER_LAYER,
      `イベントは${MAX_EVENTS_PER_LAYER}個以内にしてください`,
    ),
});

/** 核心入力 */
export const coreInputSchema = z.object({
  nature: coreNatureSchema,
  description: z
    .string()
    .max(
      CORE_DESCRIPTION_MAX_LENGTH,
      `核心の描写は${CORE_DESCRIPTION_MAX_LENGTH}文字以内にしてください`,
    )
    .transform((v) => v.trim()),
  possibleOutcomes: z
    .array(
      z
        .string()
        .max(
          OUTCOME_MAX_LENGTH,
          `結末は${OUTCOME_MAX_LENGTH}文字以内にしてください`,
        )
        .transform((v) => v.trim()),
    )
    .min(1, "結末は最低1つ必要です")
    .max(MAX_OUTCOMES, `結末は${MAX_OUTCOMES}個以内にしてください`),
});

/** 共鳴トリガー入力 */
export const resonanceInputSchema = z.object({
  fragmentType: fragmentCategorySchema,
  keywords: z
    .array(
      z
        .string()
        .max(
          KEYWORD_MAX_LENGTH,
          `キーワードは${KEYWORD_MAX_LENGTH}文字以内にしてください`,
        )
        .transform((v) => v.trim()),
    )
    .min(1, "キーワードは最低1つ必要です")
    .max(MAX_KEYWORDS, `キーワードは${MAX_KEYWORDS}個以内にしてください`),
  effect: z
    .string()
    .min(1, "効果の描写は必須です")
    .max(
      EFFECT_MAX_LENGTH,
      `効果の描写は${EFFECT_MAX_LENGTH}文字以内にしてください`,
    )
    .transform((v) => v.trim()),
});

// ========================================
// API Request Schemas
// ========================================

/**
 * ダンジョン作成リクエスト
 */
export const createDungeonSchema = z.object({
  name: dungeonNameSchema,
  alias: dungeonAliasSchema.optional().default(""),
  recommendedParty: z.string().optional().default("2〜4人"),
  difficultyTone: difficultyToneSchema.optional().default("normal"),
  tags: z
    .array(tagSchema)
    .max(MAX_TAGS, `タグは${MAX_TAGS}個以内にしてください`)
    .optional()
    .default([]),
  trialTypes: z.array(trialTypeSchema).optional().default([]),
  lore: loreInputSchema,
  layers: z
    .array(layerInputSchema)
    .min(1, "層は最低1つ必要です")
    .max(MAX_LAYERS, `層は${MAX_LAYERS}個以内にしてください`),
  core: coreInputSchema,
  resonance: z
    .array(resonanceInputSchema)
    .max(MAX_RESONANCE, `共鳴トリガーは${MAX_RESONANCE}個以内にしてください`)
    .optional()
    .default([]),
  isPublic: z.boolean().optional().default(false),
});

export type CreateDungeonInput = z.infer<typeof createDungeonSchema>;

/**
 * ダンジョン更新リクエスト
 */
export const updateDungeonSchema = z.object({
  name: dungeonNameSchema.optional(),
  alias: dungeonAliasSchema.optional(),
  recommendedParty: z.string().optional(),
  difficultyTone: difficultyToneSchema.optional(),
  tags: z
    .array(tagSchema)
    .max(MAX_TAGS, `タグは${MAX_TAGS}個以内にしてください`)
    .optional(),
  trialTypes: z.array(trialTypeSchema).optional(),
  lore: loreInputSchema.optional(),
  layers: z
    .array(layerInputSchema)
    .min(1, "層は最低1つ必要です")
    .max(MAX_LAYERS, `層は${MAX_LAYERS}個以内にしてください`)
    .optional(),
  core: coreInputSchema.optional(),
  resonance: z
    .array(resonanceInputSchema)
    .max(MAX_RESONANCE, `共鳴トリガーは${MAX_RESONANCE}個以内にしてください`)
    .optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDungeonInput = z.infer<typeof updateDungeonSchema>;

/**
 * ダンジョンID指定（パスパラメータ等）
 */
export const dungeonIdParamSchema = z.object({
  id: uuidSchema,
});

export type DungeonIdParam = z.infer<typeof dungeonIdParamSchema>;

/**
 * ダンジョン一覧取得オプション
 */
export const listDungeonsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type ListDungeonsQuery = z.infer<typeof listDungeonsQuerySchema>;
