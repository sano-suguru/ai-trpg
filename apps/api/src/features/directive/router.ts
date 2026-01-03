/**
 * Directive tRPC Router
 *
 * 行動指針マスターデータの取得エンドポイント
 * 認証不要（公開データ）
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import {
  DIRECTIVE_OPTIONS,
  getDirectivesBySituation,
  DIRECTIVE_SITUATION_LABELS,
  DIRECTIVE_SITUATIONS_ORDER,
  type DirectiveOption,
} from "@ai-trpg/shared/constants";

// ========================================
// Router
// ========================================

/**
 * Directiveルーターを作成
 */
export function createDirectiveRouter() {
  return router({
    /**
     * 全状況一覧を取得
     */
    listSituations: publicProcedure.query(() => {
      return DIRECTIVE_SITUATIONS_ORDER.map((situation) => ({
        situation,
        label: DIRECTIVE_SITUATION_LABELS[situation],
      }));
    }),

    /**
     * 指定状況の行動指針選択肢を取得
     */
    listBySituation: publicProcedure
      .input(
        z.object({
          situation: z.enum([
            "danger",
            "ally_in_peril",
            "moral_choice",
            "unknown",
          ]),
        }),
      )
      .query(({ input }) => {
        const directives = getDirectivesBySituation(input.situation);
        return directives as DirectiveOption[];
      }),

    /**
     * 全状況の行動指針選択肢を取得
     */
    listAll: publicProcedure.query(() => {
      return DIRECTIVE_OPTIONS;
    }),
  });
}
