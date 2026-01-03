/**
 * Fragment tRPC Router
 *
 * 断片マスターデータの取得エンドポイント
 * 認証不要（公開データ）
 */

import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import {
  FRAGMENT_OPTIONS,
  getFragmentsByCategory,
  getRandomFragments,
  isRequiredCategory,
  FRAGMENT_CATEGORY_LABELS,
  type FragmentOption,
} from "@ai-trpg/shared/constants";

// ========================================
// Router
// ========================================

/**
 * Fragmentルーターを作成
 */
export function createFragmentRouter() {
  return router({
    /**
     * 全断片カテゴリ一覧を取得
     */
    listCategories: publicProcedure.query(() => {
      const categories = Object.entries(FRAGMENT_CATEGORY_LABELS).map(
        ([category, label]) => ({
          category,
          label,
          required: isRequiredCategory(
            category as keyof typeof FRAGMENT_OPTIONS,
          ),
        }),
      );
      return categories;
    }),

    /**
     * 指定カテゴリの断片一覧を取得
     */
    listByCategory: publicProcedure
      .input(
        z.object({
          category: z.enum(["origin", "loss", "mark", "sin", "quest", "trait"]),
        }),
      )
      .query(({ input }) => {
        const fragments = getFragmentsByCategory(input.category);
        return fragments as FragmentOption[];
      }),

    /**
     * 全カテゴリの断片を取得
     */
    listAll: publicProcedure.query(() => {
      return FRAGMENT_OPTIONS;
    }),

    /**
     * ランダムな断片セットを取得（キャラ作成ウィザード用）
     *
     * 各カテゴリから指定数の断片をランダムに選択
     */
    getRandomSet: publicProcedure
      .input(
        z.object({
          /** 各カテゴリから取得する数（デフォルト: 3） */
          countPerCategory: z.number().min(1).max(5).optional().default(3),
        }),
      )
      .query(({ input }) => {
        const count = input.countPerCategory;

        return {
          origin: getRandomFragments("origin", count),
          loss: getRandomFragments("loss", count),
          mark: getRandomFragments("mark", count),
          sin: getRandomFragments("sin", count),
          quest: getRandomFragments("quest", count),
          trait: getRandomFragments("trait", count),
        };
      }),
  });
}
