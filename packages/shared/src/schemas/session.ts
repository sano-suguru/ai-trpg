/**
 * セッション関連のZodスキーマ
 *
 * API入力バリデーションに使用
 */

import { z } from "zod";
import { uuidSchema } from "./character";
import { fragmentCategorySchema } from "./dungeon";

// ========================================
// Constants
// ========================================

const MIN_PARTY_SIZE = 2;
const MAX_PARTY_SIZE = 4;

// ========================================
// Primitive Schemas
// ========================================

/** セッションステータス */
export const sessionStatusSchema = z.enum([
  "pending",
  "generating",
  "completed",
  "failed",
]);

/** イベント優先度 */
export const eventPrioritySchema = z.enum(["high", "normal"]);

// ========================================
// Triggered Event Schema
// ========================================

/** 発火した共鳴イベント */
export const triggeredEventSchema = z.object({
  characterName: z.string(),
  characterId: uuidSchema,
  fragmentCategory: fragmentCategorySchema,
  effect: z.string(),
  priority: eventPrioritySchema,
});

// ========================================
// Session Structure Schemas
// ========================================

/** プロットシーン */
export const plotSceneSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  summary: z.string(),
  characterFocus: z.string().nullable(),
  triggeredResonance: z.string().nullable(),
});

/** 導入部分 */
export const openingSchema = z.object({
  scene: z.string(),
  partyDynamic: z.string(),
  hook: z.string(),
});

/** 核心部分 */
export const climaxSchema = z.object({
  confrontation: z.string(),
  choiceBearer: z.string(),
  resonancePayoff: z.string().nullable(),
});

/** 結末部分 */
export const resolutionSchema = z.object({
  outcome: z.string(),
  cost: z.string(),
  changed: z.string(),
});

/** セッション構造（プロット骨子） */
export const sessionStructureSchema = z.object({
  opening: openingSchema,
  scenes: z.array(plotSceneSchema),
  climax: climaxSchema,
  resolution: resolutionSchema,
});

// ========================================
// Session Schemas
// ========================================

/** セッション作成入力 */
export const createSessionSchema = z.object({
  dungeonId: uuidSchema,
  party: z
    .array(uuidSchema)
    .min(MIN_PARTY_SIZE, `パーティは${MIN_PARTY_SIZE}人以上必要です`)
    .max(MAX_PARTY_SIZE, `パーティは${MAX_PARTY_SIZE}人以下にしてください`)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "パーティに重複するキャラクターがいます",
    ),
});

/** セッション取得入力 */
export const getSessionSchema = z.object({
  sessionId: uuidSchema,
});

/** セッションサマリ */
export const sessionSummarySchema = z.object({
  id: uuidSchema,
  dungeonName: z.string(),
  dungeonAlias: z.string(),
  partySize: z.number().int(),
  status: sessionStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

// ========================================
// SSE Event Schemas
// ========================================

/** 生成開始イベント */
export const startedEventSchema = z.object({
  type: z.literal("started"),
});

/** 共鳴スキャン完了イベント */
export const resonanceCompleteEventSchema = z.object({
  type: z.literal("resonance_complete"),
  triggeredCount: z.number().int().min(0),
});

/** プロット完了イベント */
export const plotCompleteEventSchema = z.object({
  type: z.literal("plot_complete"),
});

/** シーン生成中イベント */
export const sceneGeneratingEventSchema = z.object({
  type: z.literal("scene_generating"),
  sceneNumber: z.number().int().min(1),
  total: z.number().int().min(1),
});

/** シーン完了イベント */
export const sceneCompleteEventSchema = z.object({
  type: z.literal("scene_complete"),
  sceneNumber: z.number().int().min(1),
});

/** 生成完了イベント */
export const completedEventSchema = z.object({
  type: z.literal("completed"),
  replayId: uuidSchema,
});

/** 生成失敗イベント */
export const failedEventSchema = z.object({
  type: z.literal("failed"),
  error: z.string(),
});

/** 生成イベント（共用体） */
export const generationEventSchema = z.discriminatedUnion("type", [
  startedEventSchema,
  resonanceCompleteEventSchema,
  plotCompleteEventSchema,
  sceneGeneratingEventSchema,
  sceneCompleteEventSchema,
  completedEventSchema,
  failedEventSchema,
]);

// ========================================
// Type Exports
// ========================================

// API入力型（これらはスキーマから推論される必要がある）
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type GetSessionInput = z.infer<typeof getSessionSchema>;

// SSEイベント型（クライアントで使用）
export type GenerationEvent = z.infer<typeof generationEventSchema>;

// 注: SessionSummary, TriggeredEvent, SessionStructure は
// domain/session/types.ts で定義されているため、そちらを使用すること
