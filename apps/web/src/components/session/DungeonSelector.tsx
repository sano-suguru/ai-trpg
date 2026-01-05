/**
 * ダンジョン選択コンポーネント
 *
 * セッションで探索するダンジョンを選択
 */

import type { DungeonSummary } from "@ai-trpg/shared/domain";

interface DungeonSelectorProps {
  dungeons: readonly DungeonSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DungeonSelector({
  dungeons,
  selectedId,
  onSelect,
}: DungeonSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-200">ダンジョン選択</h3>

      {dungeons.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          利用可能なダンジョンがありません。
        </div>
      ) : (
        <div className="grid gap-4">
          {dungeons.map((dungeon) => {
            const isSelected = selectedId === (dungeon.id as string);

            return (
              <button
                key={dungeon.id as string}
                type="button"
                onClick={() => onSelect(dungeon.id as string)}
                className={`
                  p-5 rounded-lg border text-left transition-all
                  ${
                    isSelected
                      ? "border-amber-500 bg-amber-900/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-zinc-200 text-lg">
                      {dungeon.name}
                    </div>
                    {dungeon.alias && (
                      <div className="text-sm text-amber-500 mt-1">
                        ─ {dungeon.alias}
                      </div>
                    )}
                  </div>
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-4
                      ${isSelected ? "border-amber-500 bg-amber-500" : "border-zinc-600"}
                    `}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-zinc-900"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* ダンジョン情報 */}
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="px-2 py-1 rounded bg-zinc-700/50 text-zinc-400">
                    {dungeon.layerCount} 層
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      dungeon.difficultyTone === "desperate"
                        ? "bg-red-900/30 text-red-400"
                        : dungeon.difficultyTone === "heavy"
                          ? "bg-orange-900/30 text-orange-400"
                          : dungeon.difficultyTone === "normal"
                            ? "bg-amber-900/30 text-amber-400"
                            : "bg-green-900/30 text-green-400"
                    }`}
                  >
                    {dungeon.difficultyTone === "desperate"
                      ? "絶望的"
                      : dungeon.difficultyTone === "heavy"
                        ? "重い"
                        : dungeon.difficultyTone === "normal"
                          ? "普通"
                          : "軽い"}
                  </span>
                </div>

                {/* タグ */}
                {dungeon.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dungeon.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded bg-purple-900/30 text-purple-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
