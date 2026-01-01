/**
 * API エントリーポイント
 *
 * Hono + tRPC統合
 * Cloudflare Workers環境で動作
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { createAppRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { createDatabase } from "./infrastructure/database/client";
import { createCharacterRepository } from "./features/character/repository";
import { createDungeonRepository } from "./features/dungeon/repository";
import {
  createSupabaseClient,
  type AuthUser,
} from "./infrastructure/supabase/client";
import { authenticateRequest } from "./middleware/auth";

// ========================================
// Environment Types
// ========================================

interface Env {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface Variables {
  user: AuthUser | null;
}

// ========================================
// Hono App
// ========================================

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS設定（開発環境用）
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// tRPCエンドポイント
app.use("/trpc/*", async (c, next) => {
  // リクエストごとにDB接続とSupabaseクライアントを作成
  const db = createDatabase(c.env.DATABASE_URL);
  const supabase = createSupabaseClient({
    url: c.env.SUPABASE_URL,
    serviceKey: c.env.SUPABASE_SERVICE_KEY,
  });

  // 認証情報を取得してコンテキストにセット
  const user = await authenticateRequest(c, supabase);
  c.set("user", user);

  // Repositoryを作成
  const characterRepository = createCharacterRepository(db);
  const dungeonRepository = createDungeonRepository(db);

  // ルーターを作成（依存性注入）
  const appRouter = createAppRouter({
    characterRepository,
    dungeonRepository,
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
