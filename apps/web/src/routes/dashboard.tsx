/**
 * マイページ (/dashboard)
 *
 * ログインユーザーの活動拠点
 * - 自分のキャラクター一覧
 * - 新規キャラクター作成へのリンク
 */

import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ========================================
// Route Definition
// ========================================

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    // 認証チェック
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // TanStack Routerはリダイレクトにthrowが必要
      // eslint-disable-next-line functional/no-throw-statements
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

// ========================================
// Page Component
// ========================================

function DashboardPage() {
  const trpc = useTRPC();
  const {
    data: characters,
    isLoading,
    error,
  } = useQuery(trpc.character.listMine.queryOptions());

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">マイページ</h1>
      <p className="text-zinc-400 mb-8">あなたの物語の拠点</p>

      {/* キャラクターセクション */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">キャラクター</h2>
          <Link
            to="/characters/new"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors font-medium text-sm"
          >
            + 新規作成
          </Link>
        </div>

        {/* ローディング状態 */}
        {isLoading && <div className="text-zinc-500">読み込み中...</div>}

        {/* エラー状態 */}
        {error && (
          <div className="text-red-400">
            エラーが発生しました: {error.message}
          </div>
        )}

        {/* 空状態 */}
        {characters && characters.length === 0 && (
          <div className="text-center py-12 bg-zinc-800/50 rounded-xl border border-zinc-700">
            <p className="text-zinc-400 mb-4">まだキャラクターがいません</p>
            <p className="text-zinc-500 text-sm mb-6">
              最初のキャラクターを作成して、物語を始めましょう
            </p>
            <Link
              to="/characters/new"
              className="inline-block px-6 py-3 bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors font-medium"
            >
              キャラクターを作成する
            </Link>
          </div>
        )}

        {/* キャラクター一覧 */}
        {characters && characters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <Link
                key={char.id}
                to="/characters/$id"
                params={{ id: char.id }}
                className="block p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-colors"
              >
                <h3 className="text-lg font-semibold">{char.name}</h3>
                {char.title && (
                  <p className="text-amber-500 text-sm">{char.title}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
