/**
 * Character tRPC Router
 *
 * キャラクター関連のtRPCエンドポイント
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../trpc";
import { createCharacterId } from "@ai-trpg/shared/domain";
import {
  createCharacterSchema,
  updateCharacterSchema,
} from "@ai-trpg/shared/schemas";
import type { AppError } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "./repository";
import {
  createCharacterUseCase,
  getCharacterUseCase,
  listMyCharactersUseCase,
  listBorrowableCharactersUseCase,
  updateCharacterUseCase,
  deleteCharacterUseCase,
} from "./useCases";

// ========================================
// Router Factory
// ========================================

export interface CharacterRouterDeps {
  readonly repository: CharacterRepository;
  readonly generateId: () => string;
}

/**
 * Characterルーターを作成
 */
export function createCharacterRouter(deps: CharacterRouterDeps) {
  // UseCasesを初期化
  const createCharacter = createCharacterUseCase({
    repository: deps.repository,
    generateId: deps.generateId,
  });
  const getCharacter = getCharacterUseCase({ repository: deps.repository });
  const listMyCharacters = listMyCharactersUseCase({
    repository: deps.repository,
  });
  const listBorrowable = listBorrowableCharactersUseCase({
    repository: deps.repository,
  });
  const updateCharacter = updateCharacterUseCase({
    repository: deps.repository,
  });
  const deleteCharacter = deleteCharacterUseCase({
    repository: deps.repository,
  });

  return router({
    /**
     * キャラクター作成
     */
    create: protectedProcedure
      .input(createCharacterSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await createCharacter(ctx.user.id, input);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * キャラクター取得
     */
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const characterIdResult = createCharacterId(input.id);
        if (characterIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: characterIdResult.error.message,
          });
        }

        const result = await getCharacter(ctx.user.id, characterIdResult.value);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * 自分のキャラクター一覧
     */
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const result = await listMyCharacters(ctx.user.id);

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value;
    }),

    /**
     * 借用可能なキャラクター一覧（パブリック）
     */
    listBorrowable: publicProcedure.query(async () => {
      const result = await listBorrowable();

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value;
    }),

    /**
     * キャラクター更新
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          data: updateCharacterSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const characterIdResult = createCharacterId(input.id);
        if (characterIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: characterIdResult.error.message,
          });
        }

        const result = await updateCharacter(
          ctx.user.id,
          characterIdResult.value,
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
     * キャラクター削除
     */
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const characterIdResult = createCharacterId(input.id);
        if (characterIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: characterIdResult.error.message,
          });
        }

        const result = await deleteCharacter(
          ctx.user.id,
          characterIdResult.value,
        );

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
