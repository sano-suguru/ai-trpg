/**
 * パーティ編成コンポーネント
 *
 * セッション参加キャラクターを選択
 */

import type { Character } from "@ai-trpg/shared/domain";

interface PartyBuilderProps {
  characters: readonly Character[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  minParty?: number;
  maxParty?: number;
}

export function PartyBuilder({
  characters,
  selectedIds,
  onSelect,
  minParty = 2,
  maxParty = 4,
}: PartyBuilderProps) {
  const toggleCharacter = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxParty) {
      onSelect([...selectedIds, id]);
    }
  };

  const isValid =
    selectedIds.length >= minParty && selectedIds.length <= maxParty;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-200">パーティ編成</h3>
        <span className="text-sm text-zinc-400">
          {selectedIds.length} / {maxParty} 人
          {!isValid && selectedIds.length < minParty && (
            <span className="text-amber-500 ml-2">
              （最低{minParty}人必要）
            </span>
          )}
        </span>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          キャラクターがありません。まずキャラクターを作成してください。
        </div>
      ) : (
        <div className="grid gap-3">
          {characters.map((char) => {
            const isSelected = selectedIds.includes(char.id as string);
            const isDisabled = !isSelected && selectedIds.length >= maxParty;

            return (
              <button
                key={char.id as string}
                type="button"
                onClick={() => toggleCharacter(char.id as string)}
                disabled={isDisabled}
                className={`
                  p-4 rounded-lg border text-left transition-all
                  ${
                    isSelected
                      ? "border-amber-500 bg-amber-900/20"
                      : isDisabled
                        ? "border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-200">{char.name}</div>
                    {char.title && (
                      <div className="text-sm text-amber-500">{char.title}</div>
                    )}
                  </div>
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
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

                {/* フラグメントプレビュー */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(char.fragments).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-0.5 text-xs rounded bg-zinc-700/50 text-zinc-400"
                      title={value}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
