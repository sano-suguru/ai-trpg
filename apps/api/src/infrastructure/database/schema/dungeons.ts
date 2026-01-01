/**
 * ダンジョンテーブル定義（Drizzle）
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

// ========================================
// Dungeons Table
// ========================================

/**
 * ダンジョンテーブル
 *
 * lore, layers, core, resonance はJSONB型で格納
 */
export const dungeons = pgTable("dungeons", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Keys
  authorId: uuid("author_id").notNull(),

  // Basic Info
  name: text("name").notNull(),
  alias: text("alias").notNull().default(""),
  layerCount: integer("layer_count").notNull().default(3),
  recommendedParty: text("recommended_party").notNull().default("2〜4人"),
  difficultyTone: text("difficulty_tone")
    .notNull()
    .default("normal")
    .$type<"light" | "normal" | "heavy" | "desperate">(),

  // JSONB fields
  tags: jsonb("tags").notNull().$type<string[]>().default([]),
  trialTypes: jsonb("trial_types")
    .notNull()
    .$type<TrialTypeJson[]>()
    .default([]),
  lore: jsonb("lore").notNull().$type<DungeonLoreJson>(),
  layers: jsonb("layers").notNull().$type<DungeonLayerJson[]>().default([]),
  core: jsonb("core").notNull().$type<DungeonCoreJson>(),
  resonance: jsonb("resonance")
    .notNull()
    .$type<ResonanceTriggerJson[]>()
    .default([]),

  // Settings
  isPublic: boolean("is_public").notNull().default(false),
  playCount: integer("play_count").notNull().default(0),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ========================================
// JSONB Type Definitions
// ========================================

/**
 * trial_types JSONBの型定義
 */
export type TrialTypeJson =
  | "combat"
  | "exploration"
  | "puzzle"
  | "moral_choice"
  | "inner_confrontation"
  | "survival"
  | "negotiation";

/**
 * lore JSONBの型定義
 */
export interface DungeonLoreJson {
  past: string;
  fall: string;
  now: string;
}

/**
 * layers JSONBの型定義
 */
export interface DungeonLayerJson {
  name: string;
  atmosphere: string;
  possibleEvents: string[];
}

/**
 * core JSONBの型定義
 */
export interface DungeonCoreJson {
  nature: "choice" | "confrontation" | "discovery" | "loss" | "liberation";
  description: string;
  possibleOutcomes: string[];
}

/**
 * resonance JSONBの型定義
 */
export interface ResonanceTriggerJson {
  fragmentType: "origin" | "loss" | "mark" | "sin" | "quest" | "trait";
  keywords: string[];
  effect: string;
}

// ========================================
// Table Type Exports
// ========================================

export type DungeonRow = typeof dungeons.$inferSelect;
export type NewDungeonRow = typeof dungeons.$inferInsert;
