/**
 * tRPCクライアント設定
 *
 * APIサーバーとの型安全な通信を提供
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "@ai-trpg/api/trpc";
import { supabase } from "./supabase";

// ========================================
// API URL
// ========================================

function getApiUrl(): string {
  // 環境変数から取得、なければデフォルト
  // wrangler dev のデフォルトポートは 8787（wrangler pages dev は 8788）
  return import.meta.env.VITE_API_URL ?? "http://localhost:8787";
}

// ========================================
// Auth Token
// ========================================

/**
 * 現在のセッションからアクセストークンを取得
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ========================================
// tRPC Context (React Query統合)
// ========================================

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

// ========================================
// tRPC Client
// ========================================

export function createTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiUrl()}/trpc`,
        transformer: superjson,
        async headers() {
          const token = await getAuthToken();
          if (!token) {
            return {};
          }
          return {
            Authorization: `Bearer ${token}`,
          };
        },
      }),
    ],
  });
}
