/**
 * Drizzle DBクライアント
 *
 * Cloudflare Workers環境でのDB接続を管理
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ========================================
// Database Types
// ========================================

export type Database = ReturnType<typeof createDatabase>;

// ========================================
// Database Client Factory
// ========================================

/**
 * データベースクライアントを作成
 *
 * @param connectionString - PostgreSQL接続文字列
 * @returns Drizzle DBインスタンス
 */
export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, {
    // Cloudflare Workers向けの設定
    prepare: false,
    // 接続プール設定
    max: 1,
  });

  return drizzle({ client, schema });
}
