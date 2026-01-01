/**
 * 認証フック
 *
 * Supabase Authを使用した認証状態管理
 */

import { useState, useEffect, useCallback } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ========================================
// Types
// ========================================

export interface AuthState {
  /** 現在のセッション */
  session: Session | null;
  /** 現在のユーザー */
  user: User | null;
  /** ローディング中かどうか */
  isLoading: boolean;
}

export interface AuthActions {
  /** Magic Linkでサインイン */
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  /** サインアウト */
  signOut: () => Promise<{ error: AuthError | null }>;
}

export type UseAuthReturn = AuthState & AuthActions;

// ========================================
// Hook
// ========================================

/**
 * 認証状態を管理するフック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, signInWithMagicLink, signOut } = useAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   if (!user) {
 *     return <button onClick={() => signInWithMagicLink('test@example.com')}>Login</button>;
 *   }
 *
 *   return <button onClick={signOut}>Logout</button>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期セッション取得と認証状態変更の監視
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    // 認証状態変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // クリーンアップ
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Magic Linkでサインイン
  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Magic Linkクリック後のリダイレクト先
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  }, []);

  // サインアウト
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoading,
    signInWithMagicLink,
    signOut,
  };
}
