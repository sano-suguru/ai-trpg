/**
 * キャラクター一覧ページ (/characters)
 *
 * 借用可能なキャラクターを一覧表示
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/characters/")({
  component: CharactersPage,
});

function CharactersPage() {
  const trpc = useTRPC();
  // キャラクター一覧（パブリックAPI）
  const {
    data: characters,
    isLoading,
    error,
  } = useQuery(trpc.character.list.queryOptions());

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">キャラクター</h1>
      <p className="text-zinc-400 mb-8">断片によって紡がれた物語の主役たち</p>

      {isLoading && <div className="text-zinc-500">読み込み中...</div>}

      {error && (
        <div className="text-red-400">
          エラーが発生しました: {error.message}
        </div>
      )}

      {characters && characters.length === 0 && (
        <div className="text-zinc-500">まだキャラクターがいません</div>
      )}

      {characters && characters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Link
              key={char.id}
              to="/characters/$id"
              params={{ id: char.id }}
              className="block p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-colors"
            >
              <h2 className="text-xl font-semibold">{char.name}</h2>
              {char.title && (
                <p className="text-amber-500 text-sm">{char.title}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
