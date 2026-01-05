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
import { createSessionRouter } from "../features/session";
import type { SessionRepository, ReplayRepository } from "../features/session";
import { createFragmentRouter } from "../features/fragment";
import { createDirectiveRouter } from "../features/directive";
import type { Database } from "../infrastructure/database/client";
import type { LLMProvider } from "../services/llm/types";

// ========================================
// Router Dependencies
// ========================================

export interface AppRouterDeps {
  readonly db: Database;
  readonly characterRepository: CharacterRepository;
  readonly dungeonRepository: DungeonRepository;
  readonly sessionRepository: SessionRepository;
  readonly replayRepository: ReplayRepository;
  /** LLMプロバイダー（フォールバック戦略で選択済み） */
  readonly llmProvider: LLMProvider;
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

  const sessionRouter = createSessionRouter({
    sessionRepo: deps.sessionRepository,
    replayRepo: deps.replayRepository,
    dungeonRepo: deps.dungeonRepository,
    characterRepo: deps.characterRepository,
    llmProvider: deps.llmProvider,
    generateId: deps.generateId,
  });

  const fragmentRouter = createFragmentRouter();
  const directiveRouter = createDirectiveRouter();

  return router({
    auth: authRouter,
    character: characterRouter,
    dungeon: dungeonRouter,
    session: sessionRouter,
    fragment: fragmentRouter,
    directive: directiveRouter,
  });
}

/**
 * ルーター型のエクスポート
 *
 * クライアント側で型推論に使用
 */
export type AppRouter = ReturnType<typeof createAppRouter>;
