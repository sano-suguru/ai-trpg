/**
 * ロアセクションコンポーネント
 *
 * ダンジョンのロア（過去/崩壊/現在）を表示
 */

import type { DungeonLore } from "@ai-trpg/shared/domain";

interface LoreSectionProps {
  lore: DungeonLore;
}

const loreLabels = {
  past: { label: "過去", description: "かつてこの場所で何があったか" },
  fall: { label: "崩壊", description: "なぜこの場所は変わってしまったのか" },
  now: { label: "現在", description: "今この場所はどうなっているか" },
};

export function LoreSection({ lore }: LoreSectionProps) {
  const entries = [
    { key: "past" as const, text: lore.past },
    { key: "fall" as const, text: lore.fall },
    { key: "now" as const, text: lore.now },
  ];

  return (
    <div className="space-y-4">
      {entries.map(({ key, text }) => {
        const info = loreLabels[key];
        return (
          <div
            key={key}
            className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-amber-500 font-semibold">{info.label}</span>
              <span className="text-zinc-500 text-sm">{info.description}</span>
            </div>
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
