/**
 * ヘッダーコンポーネント
 *
 * サイトロゴとナビゲーション
 */

import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-amber-500 hover:text-amber-400 transition-colors">
          AI-TRPG
        </Link>
        <div className="flex gap-6">
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
        </div>
      </nav>
    </header>
  );
}
