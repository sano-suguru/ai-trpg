/**
 * キャラクターテーブル定義（Drizzle）
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ========================================
// Characters Table
// ========================================

/**
 * キャラクターテーブル
 *
 * fragments, directives, history, relationships はJSONB型で格納
 */
export const characters = pgTable("characters", {
  // Primary Key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign Keys
  ownerId: uuid("owner_id").notNull(),

  // Basic Info
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  biography: text("biography").notNull().default(""),

  // JSONB fields
  fragments: jsonb("fragments").notNull().$type<CharacterFragmentsJson>(),
  directives: jsonb("directives").notNull().$type<CharacterDirectivesJson>(),
  voiceSamples: jsonb("voice_samples")
    .notNull()
    .$type<VoiceSampleJson[]>()
    .default([]),
  history: jsonb("history").notNull().$type<HistoryEntryJson[]>().default([]),
  relationships: jsonb("relationships")
    .notNull()
    .$type<RelationshipJson[]>()
    .default([]),
  currentWounds: jsonb("current_wounds")
    .notNull()
    .$type<string[]>()
    .default([]),
  currentQuestions: jsonb("current_questions")
    .notNull()
    .$type<string[]>()
    .default([]),

  // Settings
  lending: text("lending")
    .notNull()
    .default("safe")
    .$type<"all" | "safe" | "private">(),
  isPublic: boolean("is_public").notNull().default(false),

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
 * fragments JSONBの型定義
 */
export interface CharacterFragmentsJson {
  origin: { category: "origin"; text: string };
  loss: { category: "loss"; text: string };
  mark: { category: "mark"; text: string };
  sin: { category: "sin"; text: string } | null;
  quest: { category: "quest"; text: string } | null;
  trait: { category: "trait"; text: string } | null;
}

/**
 * directives JSONBの型定義
 */
export interface CharacterDirectivesJson {
  danger: string;
  ally_in_peril: string;
  moral_choice: string;
  unknown: string;
}

/**
 * voice_samples JSONBの型定義
 */
export interface VoiceSampleJson {
  situation: string;
  sample: string;
}

/**
 * history JSONBの型定義
 */
export interface HistoryEntryJson {
  sessionId: string;
  dungeonName: string;
  partyMembers: string[];
  outcome: string;
  wounds: string[];
  date: string; // ISO 8601形式
}

/**
 * relationships JSONBの型定義
 */
export interface RelationshipJson {
  characterId: string;
  characterName: string;
  nature: "debt" | "trust" | "rival" | "understanding" | "enmity";
  detail: string;
}

// ========================================
// Table Type Exports
// ========================================

export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
