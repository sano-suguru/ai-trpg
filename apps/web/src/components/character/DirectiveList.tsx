/**
 * 行動指針リストコンポーネント
 *
 * キャラクターの行動指針を表示
 */

import type { CharacterDirectives } from "@ai-trpg/shared/domain";

interface DirectiveListProps {
  directives: CharacterDirectives;
}

const directiveLabels: Record<string, { label: string; situation: string }> = {
  danger: {
    label: "危険を前に",
    situation: "危険を前にしたとき",
  },
  allyInPeril: {
    label: "仲間の窮地",
    situation: "仲間が窮地に陥ったとき",
  },
  moralChoice: {
    label: "道徳的選択",
    situation: "道徳的選択を迫られたとき",
  },
  unknown: {
    label: "未知との遭遇",
    situation: "未知のものに遭遇したとき",
  },
};

export function DirectiveList({ directives }: DirectiveListProps) {
  const directiveEntries = [
    { key: "danger", value: directives.danger },
    { key: "allyInPeril", value: directives.allyInPeril },
    { key: "moralChoice", value: directives.moralChoice },
    { key: "unknown", value: directives.unknown },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {directiveEntries.map(({ key, value }) => {
        const info = directiveLabels[key];
        return (
          <div
            key={key}
            className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
          >
            <div className="mb-2">
              <span className="text-amber-500 font-semibold text-sm">
                {info.label}
              </span>
              <p className="text-zinc-500 text-xs">{info.situation}</p>
            </div>
            <p className="text-zinc-200">{value.response}</p>
          </div>
        );
      })}
    </div>
  );
}
