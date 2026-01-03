/**
 * キャラクター関連のZodスキーマ
 *
 * API入力バリデーションに使用
 * ドメイン型とは別に定義し、バリデーションロジックを共有
 */

import { z } from "zod";

// ========================================
// Constants (match domain model constraints)
// ========================================

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 50;
const TITLE_MAX_LENGTH = 100;
const BIOGRAPHY_MAX_LENGTH = 2000;
const FRAGMENT_MIN_LENGTH = 5;
const FRAGMENT_MAX_LENGTH = 200;
const DIRECTIVE_MIN_LENGTH = 1;
const DIRECTIVE_MAX_LENGTH = 200;

// ========================================
// Primitive Schemas
// ========================================

/** UUID形式のID */
export const uuidSchema = z.uuid();

/** キャラクター名 */
export const characterNameSchema = z
  .string()
  .min(NAME_MIN_LENGTH, "キャラクター名は必須です")
  .max(
    NAME_MAX_LENGTH,
    `キャラクター名は${NAME_MAX_LENGTH}文字以内にしてください`,
  )
  .transform((v) => v.trim());

/** キャラクター称号 */
export const characterTitleSchema = z
  .string()
  .max(TITLE_MAX_LENGTH, `称号は${TITLE_MAX_LENGTH}文字以内にしてください`)
  .transform((v) => v.trim());

/** 経歴 */
export const biographySchema = z
  .string()
  .max(
    BIOGRAPHY_MAX_LENGTH,
    `経歴は${BIOGRAPHY_MAX_LENGTH}文字以内にしてください`,
  );

/** 断片テキスト */
export const fragmentTextSchema = z
  .string()
  .min(FRAGMENT_MIN_LENGTH, `断片は${FRAGMENT_MIN_LENGTH}文字以上必要です`)
  .max(
    FRAGMENT_MAX_LENGTH,
    `断片は${FRAGMENT_MAX_LENGTH}文字以内にしてください`,
  )
  .transform((v) => v.trim());

/** 行動指針テキスト */
export const directiveTextSchema = z
  .string()
  .min(DIRECTIVE_MIN_LENGTH, "行動指針は必須です")
  .max(
    DIRECTIVE_MAX_LENGTH,
    `行動指針は${DIRECTIVE_MAX_LENGTH}文字以内にしてください`,
  )
  .transform((v) => v.trim());

/** 公開設定 */
export const lendingSettingSchema = z.enum(["all", "safe", "private"]);

// ========================================
// Composite Schemas
// ========================================

/** 断片入力 */
export const fragmentsInputSchema = z.object({
  origin: fragmentTextSchema,
  loss: fragmentTextSchema,
  mark: fragmentTextSchema,
  sin: fragmentTextSchema.nullable().optional(),
  quest: fragmentTextSchema.nullable().optional(),
  trait: fragmentTextSchema.nullable().optional(),
});

/** 行動指針入力 */
export const directivesInputSchema = z.object({
  danger: directiveTextSchema,
  allyInPeril: directiveTextSchema,
  moralChoice: directiveTextSchema,
  unknown: directiveTextSchema,
});

/** 口調サンプル */
export const voiceSampleSchema = z.object({
  situation: z.string().min(1),
  sample: z.string().min(1),
});

// ========================================
// API Request Schemas
// ========================================

/**
 * キャラクター作成リクエスト
 */
export const createCharacterSchema = z.object({
  name: characterNameSchema,
  title: characterTitleSchema,
  fragments: fragmentsInputSchema,
  directives: directivesInputSchema,
  biography: biographySchema,
  voiceSamples: z.array(voiceSampleSchema).optional(),
  lending: lendingSettingSchema.optional().default("safe"),
  isPublic: z.boolean().optional().default(false),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

/**
 * キャラクター更新リクエスト
 */
export const updateCharacterSchema = z.object({
  name: characterNameSchema.optional(),
  title: characterTitleSchema.optional(),
  biography: biographySchema.optional(),
  voiceSamples: z.array(voiceSampleSchema).optional(),
  lending: lendingSettingSchema.optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;

/**
 * キャラクターID指定（パスパラメータ等）
 */
export const characterIdParamSchema = z.object({
  id: uuidSchema,
});

export type CharacterIdParam = z.infer<typeof characterIdParamSchema>;

/**
 * キャラクター一覧取得オプション
 */
export const listCharactersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type ListCharactersQuery = z.infer<typeof listCharactersQuerySchema>;

/**
 * 借用可能キャラクター一覧取得オプション
 */
export const listBorrowableQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  excludeOwner: z.boolean().optional().default(true),
});

export type ListBorrowableQuery = z.infer<typeof listBorrowableQuerySchema>;

// ========================================
// LLM Generation Request Schemas
// ========================================

// Note: fragmentCategorySchema is defined in dungeon.ts and re-exported via index.ts

/**
 * 経歴生成リクエスト
 *
 * fragmentsInputSchemaを再利用し、断片の制約を統一
 */
export const generateBiographySchema = z.object({
  fragments: fragmentsInputSchema,
});

export type GenerateBiographyInput = z.infer<typeof generateBiographySchema>;

/**
 * 名前生成リクエスト
 *
 * fragmentsInputSchemaを再利用し、断片の制約を統一
 */
export const generateNamesSchema = z.object({
  fragments: fragmentsInputSchema,
  biography: biographySchema.min(1, "経歴は必須です"),
});

export type GenerateNamesInput = z.infer<typeof generateNamesSchema>;
