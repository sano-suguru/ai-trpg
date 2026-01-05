/**
 * シーンコンポーネント
 *
 * リプレイの個々のシーンを表示
 */

import type { Scene as SceneType } from "@ai-trpg/shared/domain";

interface SceneProps {
  scene: SceneType;
  number: number;
}

export function Scene({ scene, number }: SceneProps) {
  return (
    <article className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden">
      {/* シーンヘッダー */}
      <header className="bg-zinc-800/50 px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-amber-500">
            Scene {number}
          </span>
          <h3 className="font-semibold text-zinc-200">{scene.title}</h3>
        </div>
      </header>

      {/* シーン本文 */}
      <div className="p-5">
        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {scene.text}
        </p>
      </div>
    </article>
  );
}
