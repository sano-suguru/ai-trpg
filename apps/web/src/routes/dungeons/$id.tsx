/**
 * ダンジョン詳細ページ (/dungeons/:id)
 *
 * 公開ダンジョンの詳細を表示
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { DungeonDetail } from "@/components/dungeon/DungeonDetail";

export const Route = createFileRoute("/dungeons/$id")({
  component: DungeonDetailPage,
});

function DungeonDetailPage() {
  const { id } = Route.useParams();
  const trpc = useTRPC();

  const {
    data: dungeon,
    isLoading,
    error,
  } = useQuery(trpc.dungeon.get.queryOptions({ id }));

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-700 rounded w-1/4 mb-8" />
        <div className="h-32 bg-zinc-700 rounded mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          ダンジョンが見つかりません
        </h1>
        <p className="text-zinc-400 mb-8">
          このダンジョンは存在しないか、非公開に設定されています。
        </p>
        <Link
          to="/dungeons"
          className="text-amber-500 hover:text-amber-400 underline"
        >
          ダンジョン一覧に戻る
        </Link>
      </div>
    );
  }

  if (!dungeon) {
    return null;
  }

  return <DungeonDetail dungeon={dungeon} />;
}
