/**
 * セッション詳細ページ
 *
 * セッションとそのリプレイを表示
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "../../lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { ReplayViewer } from "../../components/replay/ReplayViewer";
import { GenerationProgress } from "../../components/session/GenerationProgress";

export const Route = createFileRoute("/sessions/$id")({
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { id } = Route.useParams();
  const trpc = useTRPC();

  // セッション取得
  const sessionQuery = useQuery(
    trpc.session.get.queryOptions({ sessionId: id }),
  );

  // リプレイ取得（セッションが完了している場合）
  const replayQuery = useQuery({
    ...trpc.session.getReplayBySession.queryOptions({ sessionId: id }),
    enabled: sessionQuery.data?.status === "completed",
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">読み込み中...</div>
      </div>
    );
  }

  if (sessionQuery.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">セッションが見つかりません</div>
          <Link to="/sessions" className="text-amber-500 hover:text-amber-400">
            セッション一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const session = sessionQuery.data;

  // 生成中の場合
  if (session?.status === "generating" || session?.status === "pending") {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <Link
              to="/sessions"
              className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
            >
              ← セッション一覧に戻る
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8">
            セッション生成中
          </h1>
          <GenerationProgress sessionId={id} />
        </div>
      </div>
    );
  }

  // 失敗の場合
  if (session?.status === "failed") {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <Link
              to="/sessions"
              className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
            >
              ← セッション一覧に戻る
            </Link>
          </div>
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
            <h1 className="text-xl font-bold text-red-400 mb-2">
              生成に失敗しました
            </h1>
            <p className="text-zinc-400">
              {session.errorMessage ?? "不明なエラーが発生しました"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 完了の場合 - リプレイを表示
  if (session?.status === "completed") {
    if (replayQuery.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-zinc-400">リプレイを読み込み中...</div>
        </div>
      );
    }

    if (replayQuery.error || !replayQuery.data) {
      return (
        <div className="min-h-screen py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="mb-8">
              <Link
                to="/sessions"
                className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
              >
                ← セッション一覧に戻る
              </Link>
            </div>
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-6 text-center">
              <h1 className="text-xl font-bold text-amber-400 mb-2">
                リプレイが見つかりません
              </h1>
              <p className="text-zinc-400">
                セッションは完了していますが、リプレイデータが見つかりませんでした
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <Link
              to="/sessions"
              className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
            >
              ← セッション一覧に戻る
            </Link>
          </div>
          <ReplayViewer replay={replayQuery.data} />
        </div>
      </div>
    );
  }

  return null;
}
