/**
 * セッション生成SSEストリーム
 *
 * 生成の進捗をリアルタイムで配信する
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { createSessionId, UnsafeIds } from "@ai-trpg/shared/domain";
import { createDatabase } from "../infrastructure/database/client";
import {
  createSupabaseClient,
  type AuthUser,
} from "../infrastructure/supabase/client";
import { authenticateRequest } from "../middleware/auth";
import {
  createSessionRepository,
  createReplayRepository,
} from "../features/session/repository";
import { createDungeonRepository } from "../features/dungeon/repository";
import { createCharacterRepository } from "../features/character/repository";
import {
  selectAvailableProvider,
  createMockProvider,
} from "../services/llm/providers";
import {
  runGenerationUseCase,
  applyHistoryUpdates,
} from "../features/session/useCases";
import { createLogger } from "../services/logger";
import type { GenerationEvent } from "../services/generation";

// ========================================
// Types
// ========================================

interface Env {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  CF_AI_GATEWAY_ID?: string;
  USE_MOCK_LLM?: string;
}

interface Variables {
  user: AuthUser | null;
}

// ========================================
// SSE Event Types
// ========================================

/**
 * クライアント向けSSEイベント
 */
type SSEEvent =
  | { type: "started" }
  | { type: "resonance_complete"; triggeredCount: number }
  | { type: "plot_complete" }
  | { type: "scene_generating"; sceneNumber: number; total: number }
  | { type: "scene_complete"; sceneNumber: number }
  | { type: "completed"; replayId: string }
  | { type: "failed"; error: string };

const logger = createLogger("SessionStream");

// ========================================
// Router
// ========================================

const sessionStreamRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * セッション生成ストリーム
 *
 * GET /api/session/:sessionId/stream
 *
 * SSEでセッション生成の進捗をリアルタイム配信
 */
sessionStreamRoutes.get("/:sessionId/stream", async (c) => {
  const { sessionId } = c.req.param();

  // DB接続とSupabaseクライアントを作成
  const db = createDatabase(c.env.DATABASE_URL);
  const supabase = createSupabaseClient({
    url: c.env.SUPABASE_URL,
    serviceKey: c.env.SUPABASE_SERVICE_KEY,
  });

  // 認証チェック
  const user = await authenticateRequest(c, supabase);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // sessionIdバリデーション
  const sessionIdResult = createSessionId(sessionId);
  if (sessionIdResult.isErr()) {
    return c.json({ error: "Invalid session ID" }, 400);
  }

  // Repositoriesを作成
  const sessionRepo = createSessionRepository(db);
  const replayRepo = createReplayRepository(db);
  const dungeonRepo = createDungeonRepository(db);
  const characterRepo = createCharacterRepository(db);

  // USE_MOCK_LLM環境変数がtrueの場合はモックプロバイダーを使用
  const useMockLlm = c.env.USE_MOCK_LLM === "true";
  const llmProvider = useMockLlm
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

  if (!llmProvider) {
    return c.json({ error: "No LLM provider available" }, 503);
  }

  if (useMockLlm) {
    logger.info("Using mock LLM provider for testing");
  }

  logger.info("Starting SSE stream", {
    sessionId,
    userId: user.id,
  });

  // SSEストリームを開始
  return streamSSE(c, async (stream) => {
    // 進捗コールバック: パイプラインからのイベントをSSEに変換
    const onProgress = async (event: GenerationEvent): Promise<void> => {
      const sseEvent = convertToSSEEvent(event);
      if (sseEvent) {
        await stream.writeSSE({
          data: JSON.stringify(sseEvent),
          event: sseEvent.type,
        });
        logger.debug("SSE event sent", { type: sseEvent.type });
      }
    };

    // 生成開始イベントを送信
    await stream.writeSSE({
      data: JSON.stringify({ type: "started" }),
      event: "started",
    });

    // 生成パイプラインを実行
    const result = await runGenerationUseCase(
      {
        sessionId: sessionIdResult.value,
        userId: UnsafeIds.userId(user.id),
      },
      {
        sessionRepo,
        replayRepo,
        dungeonRepo,
        characterRepo,
        llmProvider,
        generateId: () => crypto.randomUUID(),
        onProgress,
      },
    );

    // 結果に応じて最終イベントを送信
    if (result.isOk()) {
      // 履歴更新を適用（非同期、エラーは警告のみ）
      const historyResult = await applyHistoryUpdates({
        characterRepository: characterRepo,
      })({
        replay: result.value.replay,
        characters: result.value.characters,
      });

      if (historyResult.isErr()) {
        logger.warn("Failed to apply history updates", {
          sessionId,
          error: historyResult.error.message,
        });
      } else {
        logger.info("History updates applied", {
          sessionId,
          updatedCount: historyResult.value.updatedCharacters.length,
        });
      }

      const completedEvent: SSEEvent = {
        type: "completed",
        replayId: result.value.replay.id as string,
      };
      await stream.writeSSE({
        data: JSON.stringify(completedEvent),
        event: "completed",
      });
      logger.info("Generation completed", {
        sessionId,
        replayId: result.value.replay.id,
      });
    } else {
      const failedEvent: SSEEvent = {
        type: "failed",
        error: result.error.message,
      };
      await stream.writeSSE({
        data: JSON.stringify(failedEvent),
        event: "failed",
      });
      logger.error("Generation failed", {
        sessionId,
        error: result.error.message,
      });
    }
  });
});

// ========================================
// Helpers
// ========================================

/**
 * パイプラインイベントをSSEイベントに変換
 */
function convertToSSEEvent(event: GenerationEvent): SSEEvent | null {
  switch (event.type) {
    case "started":
      return { type: "started" };
    case "resonance_complete":
      return { type: "resonance_complete", triggeredCount: event.eventCount };
    case "plot_complete":
      return { type: "plot_complete" };
    case "scene_generating":
      return {
        type: "scene_generating",
        sceneNumber: event.current,
        total: event.total,
      };
    case "scene_complete":
      return { type: "scene_complete", sceneNumber: event.current };
    case "completed":
      return { type: "completed", replayId: event.replayId as string };
    case "failed":
      return { type: "failed", error: event.error };
    default:
      return null;
  }
}

export { sessionStreamRoutes };
