/**
 * Session tRPC Router
 *
 * セッション・リプレイ関連のtRPCエンドポイント
 */

import { TRPCError } from "@trpc/server";
import { Result } from "neverthrow";
import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import {
  createSessionId,
  createDungeonId,
  createCharacterId,
  createReplayId,
  CharacterId,
} from "@ai-trpg/shared/domain";
import {
  createSessionSchema,
  getReplaySchema,
  getReplayBySessionSchema,
} from "@ai-trpg/shared/schemas";
import type { AppError } from "@ai-trpg/shared/types";
import type { SessionRepository, ReplayRepository } from "./repository";
import type { DungeonRepository } from "../dungeon/repository";
import type { CharacterRepository } from "../character/repository";
import type { LLMProvider } from "../../services/llm/types";
import {
  createSessionUseCase,
  runGenerationUseCase,
  getSessionUseCase,
  listSessionsUseCase,
  getReplayUseCase,
  getReplayBySessionUseCase,
} from "./useCases";

// ========================================
// Router Factory
// ========================================

export interface SessionRouterDeps {
  readonly sessionRepo: SessionRepository;
  readonly replayRepo: ReplayRepository;
  readonly dungeonRepo: DungeonRepository;
  readonly characterRepo: CharacterRepository;
  /** LLMプロバイダー（フォールバック戦略で選択済み） */
  readonly llmProvider: LLMProvider;
  readonly generateId: () => string;
}

/**
 * Sessionルーターを作成
 */
export function createSessionRouter(deps: SessionRouterDeps) {
  const {
    sessionRepo,
    replayRepo,
    dungeonRepo,
    characterRepo,
    llmProvider,
    generateId,
  } = deps;

  return router({
    /**
     * セッション作成
     */
    create: protectedProcedure
      .input(createSessionSchema)
      .mutation(async ({ ctx, input }) => {
        const dungeonIdResult = createDungeonId(input.dungeonId);
        if (dungeonIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: dungeonIdResult.error.message,
          });
        }

        // Result.combineでパーティIDを一括バリデーション
        const partyIdsResult = Result.combine(
          input.party.map((id) => createCharacterId(id)),
        );
        if (partyIdsResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: partyIdsResult.error.message,
          });
        }
        const partyIds: readonly CharacterId[] = partyIdsResult.value;

        const result = await createSessionUseCase(
          {
            userId: ctx.user.id,
            dungeonId: dungeonIdResult.value,
            party: partyIds,
          },
          {
            sessionRepo,
            dungeonRepo,
            characterRepo,
            generateId,
          },
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return { sessionId: result.value.session.id };
      }),

    /**
     * セッション生成実行
     *
     * 注意: これは同期的に全生成を行う簡易版。
     * 本番では SSE エンドポイントを使用して進捗を通知する。
     */
    generate: protectedProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const sessionIdResult = createSessionId(input.sessionId);
        if (sessionIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: sessionIdResult.error.message,
          });
        }

        const result = await runGenerationUseCase(
          {
            sessionId: sessionIdResult.value,
            userId: ctx.user.id,
          },
          {
            sessionRepo,
            replayRepo,
            dungeonRepo,
            characterRepo,
            llmProvider,
            generateId,
          },
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return {
          sessionId: result.value.session.id,
          replayId: result.value.replay.id,
          totalCharCount: result.value.replay.totalCharCount,
        };
      }),

    /**
     * セッション取得
     */
    get: protectedProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const sessionIdResult = createSessionId(input.sessionId);
        if (sessionIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: sessionIdResult.error.message,
          });
        }

        const result = await getSessionUseCase(
          {
            sessionId: sessionIdResult.value,
            userId: ctx.user.id,
          },
          { sessionRepo },
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value.session;
      }),

    /**
     * セッション一覧取得
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const result = await listSessionsUseCase(
        { userId: ctx.user.id },
        { sessionRepo },
      );

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value.sessions;
    }),

    /**
     * リプレイ取得
     */
    getReplay: protectedProcedure
      .input(getReplaySchema)
      .query(async ({ ctx, input }) => {
        const replayIdResult = createReplayId(input.replayId);
        if (replayIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: replayIdResult.error.message,
          });
        }

        const result = await getReplayUseCase(
          {
            replayId: replayIdResult.value,
            userId: ctx.user.id,
          },
          { replayRepo, sessionRepo },
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value.replay;
      }),

    /**
     * セッションIDでリプレイ取得
     */
    getReplayBySession: protectedProcedure
      .input(getReplayBySessionSchema)
      .query(async ({ ctx, input }) => {
        const sessionIdResult = createSessionId(input.sessionId);
        if (sessionIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: sessionIdResult.error.message,
          });
        }

        const result = await getReplayBySessionUseCase(
          {
            sessionId: sessionIdResult.value,
            userId: ctx.user.id,
          },
          { replayRepo, sessionRepo },
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value.replay;
      }),
  });
}

// ========================================
// Helpers
// ========================================

function mapErrorCode(error: AppError): TRPCError["code"] {
  switch (error.code) {
    case "VALIDATION_ERROR":
    case "INVALID_INPUT":
      return "BAD_REQUEST";
    case "NOT_FOUND":
    case "CHARACTER_NOT_FOUND":
    case "DUNGEON_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return "NOT_FOUND";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "ALREADY_EXISTS":
      return "CONFLICT";
    case "LLM_ERROR":
    case "LLM_RATE_LIMIT":
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}
