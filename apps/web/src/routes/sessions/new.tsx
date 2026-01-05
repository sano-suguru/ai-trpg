/**
 * セッション作成ページ
 *
 * ステップウィザード形式でセッションを作成
 */

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTRPC } from "../../lib/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PartyBuilder } from "../../components/session/PartyBuilder";
import { DungeonSelector } from "../../components/session/DungeonSelector";
import { GenerationProgress } from "../../components/session/GenerationProgress";

export const Route = createFileRoute("/sessions/new")({
  component: NewSessionPage,
});

type Step = "party" | "dungeon" | "confirm" | "generating";

function NewSessionPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();

  // ステップ管理
  const [step, setStep] = useState<Step>("party");

  // 選択状態
  const [selectedParty, setSelectedParty] = useState<string[]>([]);
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // キャラクター一覧取得
  const charactersQuery = useQuery(trpc.character.listMine.queryOptions());

  // ダンジョン一覧取得
  const dungeonsQuery = useQuery(trpc.dungeon.list.queryOptions());

  // セッション作成ミューテーション
  const createSession = useMutation(
    trpc.session.create.mutationOptions({
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        // すぐに生成を開始
        generateSession.mutate({ sessionId: data.sessionId });
      },
    }),
  );

  // セッション生成ミューテーション
  const generateSession = useMutation(
    trpc.session.generate.mutationOptions({
      onSuccess: () => {
        // SSEに切り替え
        setStep("generating");
      },
    }),
  );

  // ステップ進行
  const nextStep = () => {
    if (step === "party" && selectedParty.length >= 2) {
      setStep("dungeon");
    } else if (step === "dungeon" && selectedDungeon) {
      setStep("confirm");
    }
  };

  const prevStep = () => {
    if (step === "dungeon") setStep("party");
    if (step === "confirm") setStep("dungeon");
  };

  // セッション作成開始
  const handleCreate = () => {
    if (!selectedDungeon || selectedParty.length < 2) return;

    createSession.mutate({
      dungeonId: selectedDungeon,
      party: selectedParty,
    });
    setStep("generating");
  };

  // 生成完了時
  const handleComplete: (replayId: string) => void = () => {
    if (sessionId) {
      navigate({ to: "/sessions/$id", params: { id: sessionId } });
    }
  };

  // エラー時
  const handleError: (error: string) => void = () => {
    // エラー状態を表示（GenerationProgressが対応）
  };

  // ステップインジケーター
  const steps = [
    { key: "party", label: "パーティ編成" },
    { key: "dungeon", label: "ダンジョン選択" },
    { key: "confirm", label: "確認" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  if (step === "generating" && sessionId) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-center mb-8">
            セッション生成中
          </h1>
          <GenerationProgress
            sessionId={sessionId}
            onComplete={handleComplete}
            onError={handleError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            to="/sessions"
            className="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4"
          >
            ← セッション一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold">新しいセッション</h1>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      index <= currentStepIndex
                        ? "bg-amber-500 text-zinc-900"
                        : "bg-zinc-700 text-zinc-400"
                    }
                  `}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    index <= currentStepIndex
                      ? "text-zinc-200"
                      : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      index < currentStepIndex ? "bg-amber-500" : "bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ステップコンテンツ */}
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-6">
          {step === "party" && (
            <>
              {charactersQuery.isLoading ? (
                <div className="text-center py-8 text-zinc-400">
                  読み込み中...
                </div>
              ) : charactersQuery.error ? (
                <div className="text-center py-8 text-red-400">
                  エラーが発生しました
                </div>
              ) : (
                <PartyBuilder
                  characters={charactersQuery.data ?? []}
                  selectedIds={selectedParty}
                  onSelect={setSelectedParty}
                />
              )}
            </>
          )}

          {step === "dungeon" && (
            <>
              {dungeonsQuery.isLoading ? (
                <div className="text-center py-8 text-zinc-400">
                  読み込み中...
                </div>
              ) : dungeonsQuery.error ? (
                <div className="text-center py-8 text-red-400">
                  エラーが発生しました
                </div>
              ) : (
                <DungeonSelector
                  dungeons={dungeonsQuery.data ?? []}
                  selectedId={selectedDungeon}
                  onSelect={setSelectedDungeon}
                />
              )}
            </>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-zinc-200">
                セッション内容の確認
              </h3>

              {/* パーティ */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                  パーティ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedParty.map((id) => {
                    const char = charactersQuery.data?.find(
                      (c) => (c.id as string) === id,
                    );
                    return (
                      <span
                        key={id}
                        className="px-3 py-1 bg-zinc-700/50 rounded-lg text-zinc-200"
                      >
                        {char?.name ?? id}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ダンジョン */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                  ダンジョン
                </h4>
                <span className="px-3 py-1 bg-zinc-700/50 rounded-lg text-zinc-200">
                  {dungeonsQuery.data?.find(
                    (d) => (d.id as string) === selectedDungeon,
                  )?.name ?? selectedDungeon}
                </span>
              </div>

              {/* 注意事項 */}
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <p className="text-sm text-amber-400">
                  セッション生成を開始すると、AIがTRPGリプレイを生成します。
                  生成には数分かかる場合があります。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={step === "party"}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                step === "party"
                  ? "text-zinc-600 cursor-not-allowed"
                  : "text-zinc-300 hover:bg-zinc-800"
              }
            `}
          >
            戻る
          </button>

          {step === "confirm" ? (
            <button
              onClick={handleCreate}
              disabled={createSession.isPending || generateSession.isPending}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              {createSession.isPending || generateSession.isPending
                ? "作成中..."
                : "セッション開始"}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={
                (step === "party" && selectedParty.length < 2) ||
                (step === "dungeon" && !selectedDungeon)
              }
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
