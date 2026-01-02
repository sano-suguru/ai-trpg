/**
 * 断片リストコンポーネント
 *
 * キャラクターの断片（出自、喪失、刻印等）を表示
 */

import type { CharacterFragments } from "@ai-trpg/shared/domain";

interface FragmentListProps {
  fragments: CharacterFragments;
}

const fragmentLabels: Record<string, { label: string; description: string }> = {
  origin: { label: "出自", description: "どこから来たか" },
  loss: { label: "喪失", description: "何を失ったか" },
  mark: { label: "刻印", description: "身体的・外見的特徴" },
  sin: { label: "業", description: "抱えている罪/呪い/運命" },
  quest: { label: "探求", description: "何を求めているか" },
  trait: { label: "癖/性向", description: "振る舞いの特徴" },
};

export function FragmentList({ fragments }: FragmentListProps) {
  const fragmentEntries = [
    { key: "origin", fragment: fragments.origin },
    { key: "loss", fragment: fragments.loss },
    { key: "mark", fragment: fragments.mark },
    { key: "sin", fragment: fragments.sin },
    { key: "quest", fragment: fragments.quest },
    { key: "trait", fragment: fragments.trait },
  ].filter((entry) => entry.fragment !== null && entry.fragment !== undefined);

  return (
    <div className="space-y-3">
      {fragmentEntries.map(({ key, fragment }) => {
        if (!fragment) return null;
        const info = fragmentLabels[key];
        return (
          <div
            key={key}
            className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-amber-500 font-semibold">{info.label}</span>
              <span className="text-zinc-500 text-sm">{info.description}</span>
            </div>
            <p className="text-zinc-200">{fragment.text}</p>
          </div>
        );
      })}
    </div>
  );
}
