import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TRPCProvider, createTrpcClient } from "@/lib/trpc";
import { routeTree } from "./routeTree.gen";
import "./style.css";

// ========================================
// QueryClient
// ========================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分
      retry: 1,
    },
  },
});

// ========================================
// tRPC Client
// ========================================

const trpcClient = createTrpcClient();

// ========================================
// Router
// ========================================

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
});

// 型安全なルーター宣言
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ========================================
// App Render
// ========================================

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <RouterProvider router={router} />
      </TRPCProvider>
    </QueryClientProvider>
  </StrictMode>
);
