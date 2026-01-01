/**
 * 認証ミドルウェア
 *
 * AuthorizationヘッダーからJWTを取得し、Supabaseで検証
 * 検証結果をHonoコンテキストに格納
 */

import type { Context } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getUserFromToken,
  type AuthUser,
} from "../infrastructure/supabase/client";

// ========================================
// Types
// ========================================

/**
 * 認証済みユーザー情報をHonoコンテキストに格納するための型
 */
export interface AuthVariables {
  user: AuthUser | null;
}

// ========================================
// Auth Helper
// ========================================

/**
 * リクエストから認証情報を取得してコンテキストにセット
 *
 * @param c - Honoコンテキスト
 * @param supabase - Supabaseクライアント
 * @returns ユーザー情報（未認証の場合はnull）
 */
export async function authenticateRequest(
  c: Context,
  supabase: SupabaseClient,
): Promise<AuthUser | null> {
  // Authorizationヘッダーからトークン取得
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7); // "Bearer ".length
  if (!token) {
    return null;
  }

  // Supabaseでトークン検証
  const user = await getUserFromToken(supabase, token);
  return user;
}
