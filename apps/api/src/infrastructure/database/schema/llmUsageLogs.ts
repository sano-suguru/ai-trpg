/**
 * LLM使用ログテーブル定義（Drizzle）
 *
 * レート制限と使用量分析のためのログテーブル
 */

import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

// ========================================
// LLM Usage Logs Table
// ========================================

/**
 * LLM使用ログテーブル
 *
 * 各LLM API呼び出しを記録し、レート制限のチェックに使用
 */
export const llmUsageLogs = pgTable(
  "llm_usage_logs",
  {
    // Primary Key
    id: uuid("id").primaryKey().defaultRandom(),

    // User who made the request
    userId: uuid("user_id").notNull(),

    // Endpoint that was called (e.g., "generateBiography", "generateNames")
    endpoint: text("endpoint").notNull(),

    // Timestamp of the request
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Index for efficient rate limit queries
    index("llm_usage_logs_user_id_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

// ========================================
// Table Type Exports
// ========================================

export type LLMUsageLogRow = typeof llmUsageLogs.$inferSelect;
export type NewLLMUsageLogRow = typeof llmUsageLogs.$inferInsert;
