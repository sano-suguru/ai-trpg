/**
 * ログインページ (/login)
 *
 * Magic Linkによるメール認証
 */

import { useState, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading, signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログイン済みならホームにリダイレクト
  if (!isLoading && user) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSending(true);

      const { error: authError } = await signInWithMagicLink(email);

      setIsSending(false);

      if (authError) {
        setError(authError.message);
        return;
      }

      setIsSent(true);
    },
    [email, signInWithMagicLink],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-3xl font-bold mb-8">ログイン</h1>

      {isSent ? (
        <div className="text-center">
          <p className="text-lg text-zinc-300 mb-4">
            メールを送信しました
          </p>
          <p className="text-zinc-400">
            {email} に送信されたリンクをクリックしてログインしてください。
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-zinc-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSending || !email}
            className="w-full px-6 py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            {isSending ? "送信中..." : "Magic Linkを送信"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            パスワード不要。メールに届くリンクをクリックするだけでログインできます。
          </p>
        </form>
      )}
    </div>
  );
}
