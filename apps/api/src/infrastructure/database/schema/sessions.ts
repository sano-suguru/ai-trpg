/**
 * セッションテーブル定義（Drizzle）
 */

import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { dungeons } from "./dungeons";

// ========================================
// Sessions Table
// ========================================

/**
 * セッションテーブル
 *
 * セッション生成の状態と結果を管理
 * triggered_events, structure はJSONB型で格納
 */
export const sessions = pgTable("sessions", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Keys
  userId: uuid("user_id").notNull(),
  dungeonId: uuid("dungeon_id")
    .notNull()
    .references(() => dungeons.id, { onDelete: "cascade" }),

  // Party (array of character IDs)
  party: jsonb("party").notNull().$type<string[]>(),

  // Status
  status: text("status")
    .notNull()
    .default("pending")
    .$type<SessionStatusJson>(),

  // JSONB fields
  triggeredEvents: jsonb("triggered_events")
    .notNull()
    .$type<TriggeredEventJson[]>()
    .default([]),
  structure: jsonb("structure").$type<SessionStructureJson>(),

  // Result
  replayId: uuid("replay_id"),
  errorMessage: text("error_message"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ========================================
// JSONB Type Definitions
// ========================================

/**
 * セッションステータス
 */
export type SessionStatusJson =
  | "pending"
  | "generating"
  | "completed"
  | "failed";

/**
 * 発火した共鳴イベント
 */
export interface TriggeredEventJson {
  characterName: string;
  characterId: string;
  fragmentCategory: "origin" | "loss" | "mark" | "sin" | "quest" | "trait";
  effect: string;
  priority: "high" | "normal";
}

/**
 * プロットシーン
 */
export interface PlotSceneJson {
  number: number;
  title: string;
  summary: string;
  characterFocus: string | null;
  triggeredResonance: string | null;
}

/**
 * セッション構造（プロット骨子）
 */
export interface SessionStructureJson {
  opening: {
    scene: string;
    partyDynamic: string;
    hook: string;
  };
  scenes: PlotSceneJson[];
  climax: {
    confrontation: string;
    choiceBearer: string;
    resonancePayoff: string | null;
  };
  resolution: {
    outcome: string;
    cost: string;
    changed: string;
  };
}

// ========================================
// Table Type Exports
// ========================================

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
