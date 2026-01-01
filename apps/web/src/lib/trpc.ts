/**
 * tRPCクライアント設定
 *
 * APIサーバーとの型安全な通信を提供
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import type { AppRouter } from "@ai-trpg/api/trpc";

// ========================================
// API URL
// ========================================

function getApiUrl(): string {
  // 環境変数から取得、なければデフォルト
  // wrangler devのデフォルトポートは8787だが、使用中の場合8788になる
  return import.meta.env.VITE_API_URL ?? "http://localhost:8787";
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
        // 将来の認証対応用
        // async headers() {
        //   return {
        //     authorization: getAuthToken(),
        //   };
        // },
      }),
    ],
  });
}
