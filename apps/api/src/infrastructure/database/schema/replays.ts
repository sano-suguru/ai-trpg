/**
 * リプレイテーブル定義（Drizzle）
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions";

// ========================================
// Replays Table
// ========================================

/**
 * リプレイテーブル
 *
 * セッション生成の最終成果物を格納
 * header, scenes, footer はJSONB型で格納
 */
export const replays = pgTable("replays", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Keys
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" })
    .unique(),

  // Header
  header: jsonb("header").notNull().$type<ReplayHeaderJson>(),

  // Content
  epigraph: text("epigraph").notNull(),
  scenes: jsonb("scenes").notNull().$type<SceneJson[]>(),
  epilogue: text("epilogue").notNull(),

  // Footer
  footer: jsonb("footer").notNull().$type<ReplayFooterJson>(),

  // Metrics
  totalCharCount: integer("total_char_count").notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ========================================
// JSONB Type Definitions
// ========================================

/**
 * 結末タイプ
 */
export type OutcomeTypeJson =
  | "liberation"
  | "loss"
  | "discovery"
  | "choice"
  | "confrontation";

/**
 * パーティメンバー情報
 */
export interface PartyMemberJson {
  id: string;
  name: string;
  title: string;
}

/**
 * リプレイヘッダー
 */
export interface ReplayHeaderJson {
  dungeonName: string;
  dungeonAlias: string;
  party: PartyMemberJson[];
  depthReached: number;
  outcomeType: OutcomeTypeJson;
}

/**
 * シーン
 */
export interface SceneJson {
  number: number;
  title: string;
  text: string;
}

/**
 * キャラクター変化タイプ
 */
export type ChangeTypeJson = "wound" | "inner" | "relationship" | "unchanged";

/**
 * キャラクター変化
 */
export interface CharacterChangeJson {
  characterId: string;
  characterName: string;
  changeType: ChangeTypeJson;
  description: string;
}

/**
 * リプレイフッター
 */
export interface ReplayFooterJson {
  sessionDate: string;
  survivors: string;
  characterChanges: CharacterChangeJson[];
}

// ========================================
// Table Type Exports
// ========================================

export type ReplayRow = typeof replays.$inferSelect;
export type NewReplayRow = typeof replays.$inferInsert;
