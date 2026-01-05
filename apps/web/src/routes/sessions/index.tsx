/**
 * セッション一覧ページ
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "../../lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/sessions/")({
  component: SessionsListPage,
});

function SessionsListPage() {
  const trpc = useTRPC();

  const sessionsQuery = useQuery(trpc.session.list.queryOptions());

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">セッション</h1>
          <Link
            to="/sessions/new"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            新しいセッション
          </Link>
        </div>

        {/* セッション一覧 */}
        {sessionsQuery.isLoading ? (
          <div className="text-center py-12 text-zinc-400">読み込み中...</div>
        ) : sessionsQuery.error ? (
          <div className="text-center py-12 text-red-400">
            エラーが発生しました
          </div>
        ) : sessionsQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">まだセッションがありません</p>
            <Link
              to="/sessions/new"
              className="text-amber-500 hover:text-amber-400"
            >
              最初のセッションを作成する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessionsQuery.data?.map((session) => (
              <Link
                key={session.id as string}
                to="/sessions/$id"
                params={{ id: session.id as string }}
                className="block bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`
                          px-2 py-0.5 text-xs rounded font-medium
                          ${
                            session.status === "completed"
                              ? "bg-green-900/30 text-green-400"
                              : session.status === "generating"
                                ? "bg-amber-900/30 text-amber-400"
                                : session.status === "failed"
                                  ? "bg-red-900/30 text-red-400"
                                  : "bg-zinc-700 text-zinc-400"
                          }
                        `}
                      >
                        {session.status === "completed"
                          ? "完了"
                          : session.status === "generating"
                            ? "生成中"
                            : session.status === "failed"
                              ? "失敗"
                              : "待機中"}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {new Date(session.createdAt).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>

                    {/* パーティ情報 */}
                    <div className="flex flex-wrap gap-2">
                      {session.party.map((charId, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-sm bg-zinc-700/50 rounded text-zinc-300"
                        >
                          {charId as string}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-zinc-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
