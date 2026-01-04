/**
 * キャラクター詳細コンポーネント
 *
 * キャラクターの全情報を表示
 */

import { Link } from "@tanstack/react-router";
import type { Character } from "@ai-trpg/shared/domain";
import { FragmentList } from "./FragmentList";
import { DirectiveList } from "./DirectiveList";

interface CharacterDetailProps {
  character: Character;
}

export function CharacterDetail({ character }: CharacterDetailProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* 戻るリンク */}
      <div className="mb-6">
        <Link
          to="/characters"
          className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1"
        >
          ← キャラクター一覧に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{character.name}</h1>
        {character.title && (
          <p className="text-amber-500 text-lg mt-1">{character.title}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
          <span
            className={`px-2 py-1 rounded ${
              character.lending === "all"
                ? "bg-green-900/30 text-green-400"
                : character.lending === "safe"
                  ? "bg-amber-900/30 text-amber-400"
                  : "bg-zinc-700 text-zinc-400"
            }`}
          >
            {character.lending === "all"
              ? "全開放"
              : character.lending === "safe"
                ? "安全借用可"
                : "非公開"}
          </span>
        </div>
      </header>

      {/* 過去セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
          過去 ─ Background
        </h2>
        <FragmentList fragments={character.fragments} />
      </section>

      {/* 行動指針セクション */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
          行動指針 ─ Directives
        </h2>
        <DirectiveList directives={character.directives} />
      </section>

      {/* 生い立ちセクション */}
      {character.biography && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
            生い立ち ─ Biography
          </h2>
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {character.biography}
            </p>
          </div>
        </section>
      )}

      {/* 口調サンプル */}
      {character.voiceSamples.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300 border-b border-zinc-700 pb-2">
            口調サンプル ─ Voice
          </h2>
          <div className="space-y-3">
            {character.voiceSamples.map((sample, index) => (
              <div
                key={index}
                className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
              >
                <p className="text-zinc-500 text-sm mb-1">{sample.situation}</p>
                <p className="text-zinc-200 italic">「{sample.sample}」</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
