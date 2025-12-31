/**
 * tRPCルートルーター
 *
 * 全てのFeatureルーターをマージする
 */

import { router } from "./index";
import { createCharacterRouter } from "../features/character";
import type { CharacterRepository } from "../features/character";

// ========================================
// Router Dependencies
// ========================================

export interface AppRouterDeps {
  readonly characterRepository: CharacterRepository;
  readonly generateId: () => string;
}

// ========================================
// Root Router Factory
// ========================================

/**
 * ルートルーターを作成
 *
 * 依存性を注入してルーターを構築
 */
export function createAppRouter(deps: AppRouterDeps) {
  const characterRouter = createCharacterRouter({
    repository: deps.characterRepository,
    generateId: deps.generateId,
  });

  return router({
    character: characterRouter,
    // TODO: 他のfeatureルーターを追加
    // dungeon: dungeonRouter,
    // session: sessionRouter,
  });
}

/**
 * ルーター型のエクスポート
 *
 * クライアント側で型推論に使用
 */
export type AppRouter = ReturnType<typeof createAppRouter>;
