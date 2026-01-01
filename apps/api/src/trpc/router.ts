/**
 * tRPCルートルーター
 *
 * 全てのFeatureルーターをマージする
 */

import { router } from "./index";
import { createAuthRouter } from "../features/auth";
import { createCharacterRouter } from "../features/character";
import type { CharacterRepository } from "../features/character";
import { createDungeonRouter } from "../features/dungeon";
import type { DungeonRepository } from "../features/dungeon";

// ========================================
// Router Dependencies
// ========================================

export interface AppRouterDeps {
  readonly characterRepository: CharacterRepository;
  readonly dungeonRepository: DungeonRepository;
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
  const authRouter = createAuthRouter();

  const characterRouter = createCharacterRouter({
    repository: deps.characterRepository,
    generateId: deps.generateId,
  });

  const dungeonRouter = createDungeonRouter({
    repository: deps.dungeonRepository,
    generateId: deps.generateId,
  });

  return router({
    auth: authRouter,
    character: characterRouter,
    dungeon: dungeonRouter,
    // TODO: 他のfeatureルーターを追加
    // session: sessionRouter,
  });
}

/**
 * ルーター型のエクスポート
 *
 * クライアント側で型推論に使用
 */
export type AppRouter = ReturnType<typeof createAppRouter>;
