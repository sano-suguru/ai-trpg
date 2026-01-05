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
  createSessionRepository,
  createReplayRepository,
} from "./features/session/repository";
import {
  createSupabaseClient,
  type AuthUser,
} from "./infrastructure/supabase/client";
import { authenticateRequest } from "./middleware/auth";
import {
  createLogger,
  runWithContext,
  generateRequestId,
} from "./services/logger";
import {
  createMockProvider,
  selectAvailableProvider,
} from "./services/llm/providers";
import { sessionStreamRoutes } from "./routes/session-stream";

const logger = createLogger("API");

// ========================================
// Environment Types
// ========================================

interface Env {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  // LLM API Keys (optional, at least one required)
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  // AI Gateway (Cloudflare) - required for Groq
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  CF_AI_GATEWAY_ID?: string;
  // E2Eテスト用モックモード
  USE_MOCK_LLM?: string;
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

// セッション生成SSEストリーム
app.route("/api/session", sessionStreamRoutes);

// tRPCエンドポイント
app.use("/trpc/*", async (c, next) => {
  const startTime = Date.now();
  const path = c.req.path;
  const method = c.req.method;
  const requestId = generateRequestId();

  // リクエストごとにDB接続とSupabaseクライアントを作成
  const db = createDatabase(c.env.DATABASE_URL);
  const supabase = createSupabaseClient({
    url: c.env.SUPABASE_URL,
    serviceKey: c.env.SUPABASE_SERVICE_KEY,
  });

  // 認証情報を取得してコンテキストにセット
  const user = await authenticateRequest(c, supabase);
  c.set("user", user);

  // リクエストコンテキストを設定してハンドラを実行
  // 以降のすべてのログに requestId, userId が自動付与される
  return runWithContext(
    {
      requestId,
      userId: user?.id,
      path,
      method,
    },
    async () => {
      logger.debug("Request started", { path, method });
      logger.debug("Request authenticated", {
        authenticated: !!user,
      });

      // Repositoryを作成
      const characterRepository = createCharacterRepository(db);
      const dungeonRepository = createDungeonRepository(db);
      const sessionRepository = createSessionRepository(db);
      const replayRepository = createReplayRepository(db);

      // LLMプロバイダーを作成
      // USE_MOCK_LLM=true の場合はモックプロバイダーを使用（E2Eテスト用）
      const useMockLLM = c.env.USE_MOCK_LLM === "true";

      // フォールバック戦略でプロバイダーを選択（優先順位: Groq → OpenRouter → Gemini）
      const llmProvider = useMockLLM
        ? createMockProvider()
        : selectAvailableProvider({
            groqApiKey: c.env.GROQ_API_KEY,
            openrouterApiKey: c.env.OPENROUTER_API_KEY,
            geminiApiKey: c.env.GEMINI_API_KEY,
            aiGateway: {
              accountId: c.env.CF_AI_GATEWAY_ACCOUNT_ID ?? "",
              gatewayId: c.env.CF_AI_GATEWAY_ID ?? "",
            },
          });

      // プロバイダーが利用できない場合はエラー
      if (!llmProvider) {
        logger.error("No LLM provider available");
        return c.json(
          { error: "LLMプロバイダーが設定されていません" },
          { status: 503 },
        );
      }

      // ルーターを作成（依存性注入）
      // 単一プロバイダーを両方のタスクに使用
      const appRouter = createAppRouter({
        db,
        characterRepository,
        dungeonRepository,
        sessionRepository,
        replayRepository,
        llmProvider,
        generateId: () => crypto.randomUUID(),
      });

      // tRPCミドルウェアを実行
      const result = await trpcServer({
        router: appRouter,
        createContext,
      })(c, next);

      const duration = Date.now() - startTime;
      logger.info("Request completed", { duration, status: c.res.status });

      return result;
    },
  );
});

export default app;

// ========================================
// Type Exports
// ========================================

export type { AppRouter } from "./trpc/router";
