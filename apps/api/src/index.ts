/**
 * API エントリーポイント
 *
 * Hono + tRPC統合
 * Cloudflare Workers環境で動作
 */

import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { createAppRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { createDatabase } from "./infrastructure/database/client";
import { createCharacterRepository } from "./features/character/repository";

// ========================================
// Environment Types
// ========================================

interface Env {
  DATABASE_URL: string;
}

// ========================================
// Hono App
// ========================================

const app = new Hono<{ Bindings: Env }>();

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// tRPCエンドポイント
app.use("/trpc/*", async (c, next) => {
  // リクエストごとにDB接続を作成
  const db = createDatabase(c.env.DATABASE_URL);

  // Repositoryを作成
  const characterRepository = createCharacterRepository(db);

  // ルーターを作成（依存性注入）
  const appRouter = createAppRouter({
    characterRepository,
    generateId: () => crypto.randomUUID(),
  });

  // tRPCミドルウェアを実行
  return trpcServer({
    router: appRouter,
    createContext,
  })(c, next);
});

export default app;

// ========================================
// Type Exports
// ========================================

export type { AppRouter } from "./trpc/router";
