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
import { createFragmentRouter } from "../features/fragment";
import { createDirectiveRouter } from "../features/directive";
import type { Database } from "../infrastructure/database/client";

// ========================================
// Router Dependencies
// ========================================

export interface AppRouterDeps {
  readonly db: Database;
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
    db: deps.db,
    generateId: deps.generateId,
  });

  const dungeonRouter = createDungeonRouter({
    repository: deps.dungeonRepository,
    generateId: deps.generateId,
  });

  const fragmentRouter = createFragmentRouter();
  const directiveRouter = createDirectiveRouter();

  return router({
    auth: authRouter,
    character: characterRouter,
    dungeon: dungeonRouter,
    fragment: fragmentRouter,
    directive: directiveRouter,
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
