/**
 * Supabaseクライアント設定
 *
 * JWT検証用のサーバーサイドクライアントを提供
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ========================================
// Types
// ========================================

export interface SupabaseConfig {
  readonly url: string;
  readonly serviceKey: string;
}

export interface AuthUser {
  readonly id: string;
  readonly email?: string;
}

// ========================================
// Client Factory
// ========================================

/**
 * Supabase管理クライアントを作成
 *
 * @param config - Supabase接続設定
 * @returns Supabaseクライアント
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * JWTトークンからユーザー情報を取得
 *
 * @param client - Supabaseクライアント
 * @param token - JWTトークン
 * @returns ユーザー情報（無効なトークンの場合はnull）
 */
export async function getUserFromToken(
  client: SupabaseClient,
  token: string,
): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
