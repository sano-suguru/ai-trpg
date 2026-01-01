/**
 * Supabaseクライアント設定
 *
 * フロントエンド用のSupabaseクライアントを提供
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ========================================
// Environment Variables
// ========================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

// ========================================
// Supabase Client
// ========================================

/**
 * Supabaseクライアント（シングルトン）
 *
 * 認証やデータベースアクセスに使用
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
