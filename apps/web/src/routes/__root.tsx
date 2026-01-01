/**
 * ルートレイアウト
 *
 * 全ページ共通のレイアウトを定義
 */

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/layout/Header";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}
