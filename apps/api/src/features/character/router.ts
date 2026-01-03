/**
 * Character tRPC Router
 *
 * キャラクター関連のtRPCエンドポイント
 *
 * 命名規則:
 * - get / list: 認証不要の公開データ取得
 * - getMine / listMine: 認証必須の自分のデータ取得
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../trpc";
import { createCharacterId } from "@ai-trpg/shared/domain";
import {
  createCharacterSchema,
  updateCharacterSchema,
  generateBiographySchema,
  generateNamesSchema,
} from "@ai-trpg/shared/schemas";
import type { AppError } from "@ai-trpg/shared/types";
import { getLLMService } from "../../services/llm";
import type { CharacterRepository } from "./repository";
import {
  createCharacterUseCase,
  getCharacterUseCase,
  getMyCharacterUseCase,
  listMyCharactersUseCase,
  listCharactersUseCase,
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
  const getMyCharacter = getMyCharacterUseCase({ repository: deps.repository });
  const listCharacters = listCharactersUseCase({ repository: deps.repository });
  const listMyCharacters = listMyCharactersUseCase({
    repository: deps.repository,
  });
  const updateCharacter = updateCharacterUseCase({
    repository: deps.repository,
  });
  const deleteCharacter = deleteCharacterUseCase({
    repository: deps.repository,
  });

  return router({
    // ========================================
    // Public Procedures (認証不要)
    // ========================================

    /**
     * キャラクター取得（公開）
     *
     * 認証なしでアクセス可能
     * isPublic=true かつ lending !== 'private' のキャラクターのみ
     */
    get: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const characterIdResult = createCharacterId(input.id);
        if (characterIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: characterIdResult.error.message,
          });
        }

        const result = await getCharacter(characterIdResult.value);

        if (result.isErr()) {
          throw new TRPCError({
            code: mapErrorCode(result.error),
            message: result.error.message,
          });
        }

        return result.value;
      }),

    /**
     * キャラクター一覧（公開）
     *
     * 認証なしでアクセス可能
     * 借用可能なキャラクターのみ
     */
    list: publicProcedure.query(async () => {
      const result = await listCharacters();

      if (result.isErr()) {
        throw new TRPCError({
          code: mapErrorCode(result.error),
          message: result.error.message,
        });
      }

      return result.value;
    }),

    // ========================================
    // Protected Procedures (認証必須)
    // ========================================

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
     * 自分のキャラクター取得
     *
     * 所有者のみアクセス可能
     */
    getMine: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const characterIdResult = createCharacterId(input.id);
        if (characterIdResult.isErr()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: characterIdResult.error.message,
          });
        }

        const result = await getMyCharacter(
          ctx.user.id,
          characterIdResult.value,
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

    // ========================================
    // LLM Generation Procedures (認証必須)
    // ========================================

    /**
     * 経歴生成
     *
     * 断片から経歴を自動生成
     */
    generateBiography: protectedProcedure
      .input(generateBiographySchema)
      .mutation(async ({ ctx, input }) => {
        const llmService = getLLMService(ctx.llmApiKeys);

        const result = await llmService.generateBiography({
          origin: input.fragments.origin,
          loss: input.fragments.loss,
          mark: input.fragments.mark,
          sin: input.fragments.sin ?? undefined,
          quest: input.fragments.quest ?? undefined,
          trait: input.fragments.trait ?? undefined,
        });

        if (result.isErr()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }

        return { biography: result.value };
      }),

    /**
     * 名前生成
     *
     * 断片と経歴から名前候補を自動生成
     */
    generateNames: protectedProcedure
      .input(generateNamesSchema)
      .mutation(async ({ ctx, input }) => {
        const llmService = getLLMService(ctx.llmApiKeys);

        const result = await llmService.generateNameSuggestions({
          biography: input.biography,
          fragments: {
            origin: input.fragments.origin,
            loss: input.fragments.loss,
            mark: input.fragments.mark,
            sin: input.fragments.sin ?? undefined,
            quest: input.fragments.quest ?? undefined,
            trait: input.fragments.trait ?? undefined,
          },
          count: 5,
        });

        if (result.isErr()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }

        return { names: result.value };
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
