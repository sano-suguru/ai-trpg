/**
 * リプレイビューアコンポーネント
 *
 * 生成されたリプレイを読みやすく表示
 */

import type { Replay } from "@ai-trpg/shared/domain";
import { Scene } from "./Scene";

interface ReplayViewerProps {
  replay: Replay;
}

export function ReplayViewer({ replay }: ReplayViewerProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">
          {replay.header.dungeonName}
        </h1>
        {replay.header.dungeonAlias && (
          <p className="text-lg text-amber-500 mt-2">
            ─ {replay.header.dungeonAlias}
          </p>
        )}
        <div className="mt-4 text-sm text-zinc-500">
          {new Date(replay.createdAt).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </header>

      {/* パーティ情報 */}
      <section className="mb-8 bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">参加者</h2>
        <div className="flex flex-wrap gap-3">
          {replay.header.party.map((member) => (
            <div
              key={member.id as string}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-700/50 rounded-lg"
            >
              <span className="font-medium text-zinc-200">{member.name}</span>
              {member.title && (
                <span className="text-xs text-amber-400">{member.title}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* エピグラフ（冒頭詩的なテキスト） */}
      {replay.epigraph && (
        <section className="mb-12 text-center">
          <blockquote className="italic text-zinc-400 text-lg leading-relaxed">
            &ldquo;{replay.epigraph}&rdquo;
          </blockquote>
        </section>
      )}

      {/* 探索情報 */}
      <section className="mb-8 bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-1">到達深度</h2>
            <div className="font-semibold text-zinc-200">
              第 {replay.header.depthReached} 層
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-medium text-zinc-400 mb-1">
              セッション日
            </h2>
            <div className="text-zinc-300">{replay.footer.sessionDate}</div>
          </div>
        </div>
      </section>

      {/* シーン一覧 */}
      <section className="space-y-8">
        {replay.scenes.map((scene, index) => (
          <Scene key={index} scene={scene} number={scene.number} />
        ))}
      </section>

      {/* エピローグ（結末テキスト） */}
      {replay.epilogue && (
        <section className="mt-12 mb-8 text-center">
          <div className="border-t border-zinc-700 pt-8">
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {replay.epilogue}
            </p>
          </div>
        </section>
      )}

      {/* フッター */}
      <footer className="mt-12 pt-8 border-t border-zinc-700">
        {/* 結果 */}
        <div className="mb-6 text-center">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              replay.header.outcomeType === "liberation"
                ? "bg-green-900/30 text-green-400"
                : replay.header.outcomeType === "loss"
                  ? "bg-red-900/30 text-red-400"
                  : replay.header.outcomeType === "discovery"
                    ? "bg-amber-900/30 text-amber-400"
                    : replay.header.outcomeType === "choice"
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-purple-900/30 text-purple-400"
            }`}
          >
            {replay.header.outcomeType === "liberation"
              ? "解放"
              : replay.header.outcomeType === "loss"
                ? "喪失"
                : replay.header.outcomeType === "discovery"
                  ? "発見"
                  : replay.header.outcomeType === "choice"
                    ? "選択"
                    : "対決"}
          </span>
        </div>

        {/* 生存者 */}
        {replay.footer.survivors && (
          <div className="mb-6 text-center">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">生存者</h3>
            <p className="text-zinc-300">{replay.footer.survivors}</p>
          </div>
        )}

        {/* キャラクター変化 */}
        {replay.footer.characterChanges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 text-center">
              キャラクターの変化
            </h3>
            <div className="space-y-2">
              {replay.footer.characterChanges.map((change, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-zinc-800/30 rounded-lg p-3"
                >
                  <span className="font-medium text-zinc-300 min-w-25">
                    {change.characterName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      change.changeType === "wound"
                        ? "bg-red-900/50 text-red-400"
                        : change.changeType === "relationship"
                          ? "bg-blue-900/50 text-blue-400"
                          : "bg-purple-900/50 text-purple-400"
                    }`}
                  >
                    {change.changeType === "wound"
                      ? "傷"
                      : change.changeType === "relationship"
                        ? "関係"
                        : "内面"}
                  </span>
                  <span className="text-zinc-400 flex-1">
                    {change.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 統計情報 */}
        <div className="text-center text-sm text-zinc-500">
          <span>{replay.totalCharCount.toLocaleString()} 文字</span>
          <span className="mx-2">•</span>
          <span>{replay.scenes.length} シーン</span>
        </div>
      </footer>
    </div>
  );
}
