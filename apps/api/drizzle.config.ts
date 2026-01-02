/**
 * Drizzle Kit Configuration
 *
 * DBマイグレーション用の設定ファイル
 */

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/infrastructure/database/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
} satisfies Config;
