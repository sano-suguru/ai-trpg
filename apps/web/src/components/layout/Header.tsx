/**
 * ヘッダーコンポーネント
 *
 * サイトロゴ、ナビゲーション、認証ステータス
 */

import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-amber-500 hover:text-amber-400 transition-colors"
        >
          AI-TRPG
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/characters"
            className="text-zinc-400 hover:text-zinc-100 transition-colors [&.active]:text-amber-500"
          >
            キャラクター
          </Link>
          <Link
            to="/dungeons"
            className="text-zinc-400 hover:text-zinc-100 transition-colors [&.active]:text-amber-500"
          >
            ダンジョン
          </Link>

          {/* 認証ステータス */}
          {isLoading ? (
            <span className="text-zinc-500 text-sm">...</span>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-zinc-400 text-sm">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors text-sm"
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
