/**
 * 認証フック
 *
 * Supabase Authを使用した認証状態管理
 */

import { useState, useEffect, useCallback } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

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
    logger.debug("Auth: Initializing session");

    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);
      logger.info("Auth: Session initialized", {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
      });
    });

    // 認証状態変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logger.info("Auth: State changed", {
        event,
        hasSession: !!newSession,
        userId: newSession?.user?.id,
      });
      setSession(newSession);
    });

    // クリーンアップ
    return () => {
      logger.debug("Auth: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  // Magic Linkでサインイン
  const signInWithMagicLink = useCallback(async (email: string) => {
    logger.info("Auth: Signing in with Magic Link", { email });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Magic Linkクリック後のリダイレクト先
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      logger.error("Auth: Magic Link sign in failed", {
        error: error.message,
        code: error.code,
      });
    } else {
      logger.info("Auth: Magic Link sent successfully", { email });
    }
    return { error };
  }, []);

  // サインアウト
  const signOut = useCallback(async () => {
    logger.info("Auth: Signing out");
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error("Auth: Sign out failed", {
        error: error.message,
        code: error.code,
      });
    } else {
      logger.info("Auth: Signed out successfully");
    }
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
