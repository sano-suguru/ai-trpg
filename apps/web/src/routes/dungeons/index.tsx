/**
 * ダンジョン一覧ページ (/dungeons)
 *
 * 公開ダンジョンを一覧表示
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dungeons/")({
  component: DungeonsPage,
});

function DungeonsPage() {
  const trpc = useTRPC();
  // 公開ダンジョン一覧（パブリックAPI）
  const {
    data: dungeons,
    isLoading,
    error,
  } = useQuery(trpc.dungeon.list.queryOptions());

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">ダンジョン</h1>
      <p className="text-zinc-400 mb-8">
        キャラの傷を抉り、問いに答えを迫る場所
      </p>

      {isLoading && <div className="text-zinc-500">読み込み中...</div>}

      {error && (
        <div className="text-red-400">
          エラーが発生しました: {error.message}
        </div>
      )}

      {dungeons && dungeons.length === 0 && (
        <div className="text-zinc-500">まだダンジョンがありません</div>
      )}

      {dungeons && dungeons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dungeons.map((dungeon) => (
            <Link
              key={dungeon.id}
              to="/dungeons/$id"
              params={{ id: dungeon.id }}
              className="block p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-colors"
            >
              <h2 className="text-xl font-semibold">{dungeon.name}</h2>
              {dungeon.alias && (
                <p className="text-zinc-500 text-sm italic">
                  ─ {dungeon.alias}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {dungeon.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
