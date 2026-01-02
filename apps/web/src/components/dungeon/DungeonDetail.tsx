/**
 * ダンジョン詳細コンポーネント
 *
 * ダンジョンの全情報を表示
 */

import { Link } from "@tanstack/react-router";
import type { Dungeon } from "@ai-trpg/shared/domain";
import { LoreSection } from "./LoreSection";
import { LayerOverview } from "./LayerOverview";

interface DungeonDetailProps {
  dungeon: Dungeon;
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  light: { label: "軽い", color: "bg-green-900/30 text-green-400" },
  normal: { label: "普通", color: "bg-zinc-700 text-zinc-300" },
  heavy: { label: "重い", color: "bg-amber-900/30 text-amber-400" },
  desperate: { label: "絶望的", color: "bg-red-900/30 text-red-400" },
};

const trialTypeLabels: Record<string, string> = {
  combat: "戦闘",
  exploration: "探索",
  puzzle: "謎解き",
  moral_choice: "道徳選択",
  inner_confrontation: "内面対峙",
  survival: "生存",
  negotiation: "交渉",
};

export function DungeonDetail({ dungeon }: DungeonDetailProps) {
  const difficulty = difficultyLabels[dungeon.difficultyTone] ?? {
    label: dungeon.difficultyTone,
    color: "bg-zinc-700 text-zinc-300",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 戻るリンク */}
      <div className="mb-6">
        <Link
          to="/dungeons"
          className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
        >
          ← ダンジョン一覧に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{dungeon.name}</h1>
        {dungeon.alias && (
          <p className="text-zinc-500 text-lg mt-1 italic">─ {dungeon.alias}</p>
        )}

        {/* 基本情報 */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className={`px-2 py-1 rounded ${difficulty.color}`}>
            {difficulty.label}
          </span>
          <span className="text-zinc-400">
            {dungeon.layerCount}層 / {dungeon.recommendedParty}
          </span>
          <span className="text-zinc-500">
            プレイ回数: {dungeon.playCount}
          </span>
        </div>

        {/* タグ */}
        <div className="mt-4 flex flex-wrap gap-2">
          {dungeon.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 試練タイプ */}
        <div className="mt-3 flex flex-wrap gap-2">
          {dungeon.trialTypes.map((type) => (
            <span
              key={type}
              className="px-2 py-1 bg-amber-900/20 rounded text-xs text-amber-400"
            >
              {trialTypeLabels[type] ?? type}
            </span>
          ))}
        </div>
      </header>

      {/* ロアセクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
          ロア ─ Lore
        </h2>
        <LoreSection lore={dungeon.lore} />
      </section>

      {/* 層構造 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
          層構造 ─ Layers
        </h2>
        <LayerOverview layers={dungeon.layers} />
      </section>

      {/* 核心のヒント */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
          核心 ─ Core
        </h2>
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <p className="text-amber-500 text-sm mb-2">
            ※ネタバレ注意：核心の内容が含まれます
          </p>
          <details className="group">
            <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 select-none">
              クリックして表示
            </summary>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-zinc-400 text-sm mb-2">
                核心の性質:{" "}
                <span className="text-amber-400">{dungeon.core.nature}</span>
              </p>
              <p className="text-zinc-300 whitespace-pre-wrap">
                {dungeon.core.description}
              </p>
              {dungeon.core.possibleOutcomes.length > 0 && (
                <div className="mt-4">
                  <p className="text-zinc-500 text-sm mb-2">想定される結末:</p>
                  <ul className="space-y-1">
                    {dungeon.core.possibleOutcomes.map((outcome, index) => (
                      <li key={index} className="text-zinc-400 text-sm">
                        • {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </div>
      </section>

      {/* 共鳴トリガー */}
      {dungeon.resonance.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
            共鳴 ─ Resonance
          </h2>
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <p className="text-amber-500 text-sm mb-4">
              キャラクターの断片とダンジョンが共鳴すると特別なイベントが発生します
            </p>
            <div className="space-y-3">
              {dungeon.resonance.map((trigger, index) => (
                <div
                  key={index}
                  className="p-3 bg-zinc-900/50 rounded border border-zinc-600"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 text-sm">
                      {trigger.fragmentType}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      キーワード: {trigger.keywords.join(", ")}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm">{trigger.effect}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
