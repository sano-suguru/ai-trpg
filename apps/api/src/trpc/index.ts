/**
 * tRPC初期化・プロシージャ定義
 *
 * tRPCのコア設定とプロシージャを定義
 * - publicProcedure: 認証不要
 * - protectedProcedure: 認証必須
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";

// ========================================
// tRPC Initialization
// ========================================

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // カスタムエラーデータを追加可能
      },
    };
  },
});

// ========================================
// Routers & Procedures
// ========================================

/**
 * ルーター作成関数
 */
export const router = t.router;

/**
 * パブリックプロシージャ（認証不要）
 */
export const publicProcedure = t.procedure;

/**
 * 認証済みプロシージャ
 *
 * middlewareで認証チェックを行い、未認証の場合はエラーを返す
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "認証が必要です",
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      // user が null でないことが保証される
      user: ctx.user,
    },
  });
});

/**
 * ミドルウェア作成関数
 */
export const middleware = t.middleware;

/**
 * マージルーター作成関数
 */
export const mergeRouters = t.mergeRouters;
