/**
 * リプレイ関連のZodスキーマ
 *
 * API入力バリデーションに使用
 */

import { z } from "zod";
import { uuidSchema } from "./character";

// ========================================
// Constants
// ========================================

const MIN_SCENE_COUNT = 5;
const MAX_SCENE_COUNT = 10;
const MIN_SCENE_TEXT_LENGTH = 100;
const MAX_SCENE_TEXT_LENGTH = 1000;

// ========================================
// Primitive Schemas
// ========================================

/** 結末タイプ */
export const outcomeTypeSchema = z.enum([
  "liberation",
  "loss",
  "discovery",
  "choice",
  "confrontation",
]);

/** キャラクター変化タイプ */
export const changeTypeSchema = z.enum([
  "wound",
  "inner",
  "relationship",
  "unchanged",
]);

// ========================================
// Party Member Schema
// ========================================

/** パーティメンバー情報 */
export const partyMemberInfoSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  title: z.string(),
});

// ========================================
// Replay Header Schema
// ========================================

/** リプレイヘッダー */
export const replayHeaderSchema = z.object({
  dungeonName: z.string().min(1),
  dungeonAlias: z.string(),
  party: z.array(partyMemberInfoSchema).min(2).max(4),
  depthReached: z.number().int().min(1),
  outcomeType: outcomeTypeSchema,
});

// ========================================
// Scene Schema
// ========================================

/** シーン */
export const sceneSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1, "シーンタイトルは必須です"),
  text: z
    .string()
    .min(
      MIN_SCENE_TEXT_LENGTH,
      `シーン本文は${MIN_SCENE_TEXT_LENGTH}文字以上必要です`,
    )
    .max(
      MAX_SCENE_TEXT_LENGTH,
      `シーン本文は${MAX_SCENE_TEXT_LENGTH}文字以内にしてください`,
    ),
});

// ========================================
// Character Change Schema
// ========================================

/** キャラクター変化 */
export const characterChangeSchema = z.object({
  characterId: uuidSchema,
  characterName: z.string(),
  changeType: changeTypeSchema,
  description: z.string(),
});

// ========================================
// Replay Footer Schema
// ========================================

/** リプレイフッター */
export const replayFooterSchema = z.object({
  sessionDate: z.string().min(1),
  survivors: z.string(),
  characterChanges: z.array(characterChangeSchema),
});

// ========================================
// Replay Schemas
// ========================================

/** リプレイ取得入力 */
export const getReplaySchema = z.object({
  replayId: uuidSchema,
});

/** セッションIDでリプレイ取得 */
export const getReplayBySessionSchema = z.object({
  sessionId: uuidSchema,
});

/** リプレイサマリ */
export const replaySummarySchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  dungeonName: z.string(),
  dungeonAlias: z.string(),
  outcomeType: outcomeTypeSchema,
  partySize: z.number().int(),
  sceneCount: z.number().int(),
  totalCharCount: z.number().int(),
  createdAt: z.date(),
});

/** リプレイ全体 */
export const replaySchema = z.object({
  id: uuidSchema,
  sessionId: uuidSchema,
  header: replayHeaderSchema,
  epigraph: z.string().min(1, "エピグラフは必須です"),
  scenes: z
    .array(sceneSchema)
    .min(MIN_SCENE_COUNT, `リプレイは最低${MIN_SCENE_COUNT}シーン必要です`)
    .max(MAX_SCENE_COUNT, `リプレイは最大${MAX_SCENE_COUNT}シーンまでです`),
  epilogue: z.string().min(1, "エピローグは必須です"),
  footer: replayFooterSchema,
  totalCharCount: z.number().int(),
  createdAt: z.date(),
});

// ========================================
// Type Exports
// ========================================

// API入力型（これらはスキーマから推論される必要がある）
export type GetReplayInput = z.infer<typeof getReplaySchema>;
export type GetReplayBySessionInput = z.infer<typeof getReplayBySessionSchema>;

// 注: Replay, ReplaySummary, Scene, ReplayHeader, ReplayFooter,
// PartyMemberInfo, CharacterChange, OutcomeType, ChangeType は
// domain/replay/types.ts で定義されているため、そちらを使用すること
