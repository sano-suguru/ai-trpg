/**
 * tRPCコンテキスト定義
 *
 * リクエストごとに作成されるコンテキストオブジェクト
 * 認証情報やデータベース接続などを保持
 */

import type { Context as HonoContext } from "hono";
import type { UserId } from "@ai-trpg/shared/domain";

// ========================================
// Context Types
// ========================================

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  readonly id: UserId;
}

/**
 * tRPCで使用するコンテキスト型
 *
 * 認証状態によって user の有無が変わる
 * Note: @hono/trpc-serverはRecord<string, unknown>を期待するためインデックスシグネチャが必要
 */
export interface TRPCContext {
  readonly honoContext: HonoContext;
  readonly user: AuthUser | null;
  readonly [key: string]: unknown;
}

/**
 * 認証済みコンテキスト
 */
export interface AuthenticatedTRPCContext extends TRPCContext {
  readonly user: AuthUser;
}

// ========================================
// Context Creator
// ========================================

/**
 * コンテキスト生成関数
 *
 * @hono/trpc-serverのcreateContextは (_opts, honoContext) の形式
 * @param _opts - tRPC FetchCreateContextFnOptions（未使用）
 * @param c - Honoコンテキスト
 * @returns tRPCコンテキスト
 */
export function createContext(_opts: unknown, c: HonoContext): TRPCContext {
  // TODO: 認証情報をHonoコンテキストから取得
  // 現時点ではnullを返す（未認証）
  return {
    honoContext: c,
    user: null,
  };
}

// ========================================
// Type Utilities
// ========================================

/**
 * 認証済みコンテキストの型ガード
 */
export function isAuthenticated(
  ctx: TRPCContext
): ctx is AuthenticatedTRPCContext {
  return ctx.user !== null;
}
