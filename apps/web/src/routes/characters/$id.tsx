/**
 * キャラクター詳細ページ (/characters/:id)
 *
 * キャラクターの詳細を表示
 * - ログイン中かつ所有者: getMine APIを使用（非公開でも閲覧可能）
 * - それ以外: get API（公開キャラのみ閲覧可能）
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { CharacterDetail } from "@/components/character/CharacterDetail";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/characters/$id")({
  component: CharacterDetailPage,
});

function CharacterDetailPage() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const { user, isLoading: isAuthLoading } = useAuth();

  // 認証ユーザーの場合はまずgetMineを試行
  const {
    data: myCharacter,
    isLoading: isMyLoading,
    error: myError,
  } = useQuery({
    ...trpc.character.getMine.queryOptions({ id }),
    enabled: !!user, // ログイン中のみ実行
  });

  // getMineが失敗した場合、または非ログインの場合は公開APIを使用
  const shouldFetchPublic = !user || (!!myError && !isMyLoading);
  const {
    data: publicCharacter,
    isLoading: isPublicLoading,
    error: publicError,
  } = useQuery({
    ...trpc.character.get.queryOptions({ id }),
    enabled: shouldFetchPublic,
  });

  // ローディング状態の判定
  const isLoading =
    isAuthLoading ||
    (user ? isMyLoading : false) ||
    (shouldFetchPublic ? isPublicLoading : false);

  // 最終的なキャラクターデータ（getMine優先）
  const character = myCharacter ?? publicCharacter;

  // エラー判定: 両方のAPIが失敗した場合のみエラー
  const hasError = user ? !!myError && !!publicError : !!publicError;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-700 rounded w-1/4 mb-8" />
        <div className="h-32 bg-zinc-700 rounded mb-4" />
      </div>
    );
  }

  if (hasError || !character) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          キャラクターが見つかりません
        </h1>
        <p className="text-zinc-400 mb-8">
          このキャラクターは存在しないか、非公開に設定されています。
        </p>
        <Link
          to="/characters"
          className="text-amber-500 hover:text-amber-400 underline"
        >
          キャラクター一覧に戻る
        </Link>
      </div>
    );
  }

  return <CharacterDetail character={character} />;
}
