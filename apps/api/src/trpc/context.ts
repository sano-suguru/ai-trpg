/**
 * tRPCコンテキスト定義
 *
 * リクエストごとに作成されるコンテキストオブジェクト
 * 認証情報やデータベース接続などを保持
 */

import type { Context as HonoContext } from "hono";
import { UnsafeIds, type UserId } from "@ai-trpg/shared/domain";
import type { AuthUser as SupabaseAuthUser } from "../infrastructure/supabase/client";
import type { LLMApiKeys, AIGatewayConfig } from "../services/llm/types";

// Re-export for convenience
export type { LLMApiKeys, AIGatewayConfig };

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
  readonly llmApiKeys: LLMApiKeys;
  readonly aiGateway: AIGatewayConfig | undefined;
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
 * 環境変数の型
 */
interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  CF_AI_GATEWAY_ACCOUNT_ID?: string;
  CF_AI_GATEWAY_ID?: string;
}

/**
 * Honoコンテキストの型（認証ミドルウェア適用後）
 */
interface AuthenticatedHonoContext extends HonoContext {
  get(key: "user"): SupabaseAuthUser | null;
  env: Env;
}

/**
 * コンテキスト生成関数
 *
 * @hono/trpc-serverのcreateContextは (_opts, honoContext) の形式
 * @param _opts - tRPC FetchCreateContextFnOptions（未使用）
 * @param c - Honoコンテキスト（認証ミドルウェア適用後）
 * @returns tRPCコンテキスト
 */
export function createContext(_opts: unknown, c: HonoContext): TRPCContext {
  // 認証ミドルウェアがセットしたユーザー情報を取得
  const honoCtx = c as AuthenticatedHonoContext;
  const supabaseUser = honoCtx.get("user");

  // SupabaseのユーザーIDをドメインのUserId型に変換
  const user: AuthUser | null = supabaseUser
    ? { id: UnsafeIds.userId(supabaseUser.id) }
    : null;

  // LLM APIキーを取得（環境変数からLLMApiKeys型に変換）
  const llmApiKeys: LLMApiKeys = {
    groq: honoCtx.env.GROQ_API_KEY,
    gemini: honoCtx.env.GEMINI_API_KEY,
    openrouter: honoCtx.env.OPENROUTER_API_KEY,
  };

  // AI Gateway設定を取得（両方の環境変数が設定されている場合のみ有効）
  const aiGateway: AIGatewayConfig | undefined =
    honoCtx.env.CF_AI_GATEWAY_ACCOUNT_ID && honoCtx.env.CF_AI_GATEWAY_ID
      ? {
          accountId: honoCtx.env.CF_AI_GATEWAY_ACCOUNT_ID,
          gatewayId: honoCtx.env.CF_AI_GATEWAY_ID,
        }
      : undefined;

  return {
    honoContext: c,
    user,
    llmApiKeys,
    aiGateway,
  };
}

// ========================================
// Type Utilities
// ========================================

/**
 * 認証済みコンテキストの型ガード
 */
export function isAuthenticated(
  ctx: TRPCContext,
): ctx is AuthenticatedTRPCContext {
  return ctx.user !== null;
}
