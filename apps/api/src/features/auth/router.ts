/**
 * 認証ルーター
 *
 * セッション取得などの認証関連エンドポイント
 */

import { router, publicProcedure } from "../../trpc";

// ========================================
// Router
// ========================================

/**
 * 認証ルーターを作成
 */
export function createAuthRouter() {
  return router({
    /**
     * 現在のセッション情報を取得
     *
     * 認証済みの場合はユーザー情報を返し、
     * 未認証の場合はnullを返す
     */
    getSession: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        return null;
      }
      return {
        user: {
          id: ctx.user.id,
        },
      };
    }),
  });
}
