/**
 * Dungeon tRPC Router
 *
 * ダンジョン関連のtRPCエンドポイント
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../trpc";
import { createDungeonId } from "@ai-trpg/shared/domain";
import {
  createDungeonSchema,
  updateDungeonSchema,
} from "@ai-trpg/shared/schemas";
import type { AppError } from "@ai-trpg/shared/types";
import type { DungeonRepository } from "./repository";
import {
  createDungeonUseCase,
  getDungeonUseCase,
  listPublicDungeonsUseCase,
  listMyDungeonsUseCase,
  updateDungeonUseCase,
  deleteDungeonUseCase,
} from "./useCases";

// ========================================
// Router Factory
// ========================================

export interface DungeonRouterDeps {
  readonly repository: DungeonRepository;
  readonly generateId: () => string;
}

/**
 * Dungeonルーターを作成
 */
export function createDungeonRouter(deps: DungeonRouterDeps) {
  // UseCasesを初期化
  const createDungeon = createDungeonUseCase({
    repository: deps.repository,
    generateId: deps.generateId,
  });
  const getDungeon = getDungeonUseCase({ repository: deps.repository });
  const listPublicDungeons = listPublicDungeonsUseCase({
    repository: deps.repository,
  });
  const listMyDungeons = listMyDungeonsUseCase({
    repository: deps.repository,
  });
  const updateDungeon = updateDungeonUseCase({
    repository: deps.repository,
  });
  const deleteDungeon = deleteDungeonUseCase({
    repository: deps.repository,
  });

  return router({
    /**
     * ダンジョン作成
     */
    create: protectedProcedure
      .input(createDungeonSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await createDungeon(ctx.user.id, input);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * ダンジョン取得
     */
    get: publicProcedure
      .input(z.object({ id: z.uuid() }))
      .query(async ({ input }) => {
        const dungeonIdResult = createDungeonId(input.id);
        if (dungeonIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: dungeonIdResult.error.message,
          });
        }

        // 公開エンドポイントなのでuserIdはnull
        const result = await getDungeon(null, dungeonIdResult.value);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * 公開ダンジョン一覧
     */
    list: publicProcedure.query(async () => {
      const result = await listPublicDungeons();

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value;
    }),

    /**
     * 自分のダンジョン一覧
     */
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const result = await listMyDungeons(ctx.user.id);

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value;
    }),

    /**
     * ダンジョン更新
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.uuid(),
          data: updateDungeonSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const dungeonIdResult = createDungeonId(input.id);
        if (dungeonIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: dungeonIdResult.error.message,
          });
        }

        const result = await updateDungeon(
          ctx.user.id,
          dungeonIdResult.value,
          input.data,
        );

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * ダンジョン削除
     */
    delete: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        const dungeonIdResult = createDungeonId(input.id);
        if (dungeonIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: dungeonIdResult.error.message,
          });
        }

        const result = await deleteDungeon(ctx.user.id, dungeonIdResult.value);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return { success: true };
      }),
  });
}

// ========================================
// Error Mapping
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
    case "DATABASE_ERROR":
    case "CONNECTION_ERROR":
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}
