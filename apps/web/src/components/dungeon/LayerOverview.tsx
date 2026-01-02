/**
 * 層概要コンポーネント
 *
 * ダンジョンの層構造を表示
 */

import type { DungeonLayer } from "@ai-trpg/shared/domain";

interface LayerOverviewProps {
  layers: readonly DungeonLayer[];
}

export function LayerOverview({ layers }: LayerOverviewProps) {
  if (layers.length === 0) {
    return <p className="text-zinc-500">層情報がありません</p>;
  }

  return (
    <div className="space-y-4">
      {layers.map((layer, index) => (
        <div
          key={index}
          className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-amber-500 font-semibold">
              第{index + 1}層
            </span>
            <span className="text-zinc-300">{layer.name}</span>
          </div>

          <p className="text-zinc-400 text-sm mb-3">{layer.atmosphere}</p>

          {layer.possibleEvents.length > 0 && (
            <div>
              <p className="text-zinc-500 text-xs mb-1">想定されるイベント:</p>
              <ul className="space-y-1">
                {layer.possibleEvents.map((event, eventIndex) => (
                  <li key={eventIndex} className="text-zinc-400 text-sm">
                    • {event}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
