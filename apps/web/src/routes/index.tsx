/**
 * ホームページ (/)
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-5xl font-bold mb-4">AI-TRPG</h1>
      <p className="text-xl text-zinc-400 mb-2">灰暦の世界</p>
      <p className="text-zinc-500 italic mb-8">
        "神々は去り、英雄は朽ち、それでも人は歩き続ける"
      </p>
      <div className="flex gap-4">
        <a
          href="/characters"
          className="px-6 py-3 bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors"
        >
          キャラクター
        </a>
        <a
          href="/dungeons"
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
        >
          ダンジョン
        </a>
      </div>
    </div>
  );
}
