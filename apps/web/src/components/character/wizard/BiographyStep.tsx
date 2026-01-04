/**
 * 経歴生成ステップ
 *
 * AIによる経歴生成と編集
 */

import { useEffect, useRef } from "react";
import { useTRPC } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { useCharacterCreationStore } from "@/stores/characterCreation";

// ========================================
// Biography Step Component
// ========================================

export function BiographyStep() {
  const {
    fragments,
    biography,
    setBiography,
    isGeneratingBiography,
    setIsGeneratingBiography,
    biographyError,
    setBiographyError,
    goToNextStep,
    goToPreviousStep,
  } = useCharacterCreationStore();

  const trpc = useTRPC();

  // 自動生成の重複実行を防ぐためのフラグ
  const hasTriggeredAutoGenerate = useRef(false);

  // 経歴生成ミューテーション
  const generateBiographyMutation = useMutation(
    trpc.character.generateBiography.mutationOptions({
      onSuccess: (data) => {
        setBiography(data.biography);
        setIsGeneratingBiography(false);
        setBiographyError(null);
      },
      onError: (error) => {
        setIsGeneratingBiography(false);
        setBiographyError(error.message);
      },
    }),
  );

  // 初回マウント時に経歴が空なら自動生成
  // refで重複実行を防ぎ、依存配列を正しく設定
  useEffect(() => {
    if (
      !hasTriggeredAutoGenerate.current &&
      biography === "" &&
      !isGeneratingBiography &&
      fragments.origin &&
      fragments.loss &&
      fragments.mark
    ) {
      hasTriggeredAutoGenerate.current = true;
      // handleGenerateではなく直接mutateを呼ぶ（依存関係を単純化）
      setIsGeneratingBiography(true);
      setBiographyError(null);
      generateBiographyMutation.mutate({
        fragments: {
          origin: fragments.origin,
          loss: fragments.loss,
          mark: fragments.mark,
          sin: fragments.sin,
          quest: fragments.quest,
          trait: fragments.trait,
        },
      });
    }
  }, [
    biography,
    isGeneratingBiography,
    fragments.origin,
    fragments.loss,
    fragments.mark,
    fragments.sin,
    fragments.quest,
    fragments.trait,
    setIsGeneratingBiography,
    setBiographyError,
    generateBiographyMutation,
  ]);

  const handleGenerate = () => {
    if (!fragments.origin || !fragments.loss || !fragments.mark) {
      setBiographyError("必須の過去が選択されていません");
      return;
    }

    setIsGeneratingBiography(true);
    setBiographyError(null);

    generateBiographyMutation.mutate({
      fragments: {
        origin: fragments.origin,
        loss: fragments.loss,
        mark: fragments.mark,
        sin: fragments.sin,
        quest: fragments.quest,
        trait: fragments.trait,
      },
    });
  };

  const canProceed = biography.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          生い立ちを生成
        </h2>
        <p className="text-zinc-400">
          選んだ過去からキャラクターの生い立ちを生成します
        </p>
      </div>

      {/* 選択された断片の表示 */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">選択した過去</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {fragments.origin && (
            <div>
              <span className="text-amber-500">出自:</span>{" "}
              <span className="text-zinc-300">{fragments.origin}</span>
            </div>
          )}
          {fragments.loss && (
            <div>
              <span className="text-amber-500">喪失:</span>{" "}
              <span className="text-zinc-300">{fragments.loss}</span>
            </div>
          )}
          {fragments.mark && (
            <div>
              <span className="text-amber-500">刻印:</span>{" "}
              <span className="text-zinc-300">{fragments.mark}</span>
            </div>
          )}
          {fragments.sin && (
            <div>
              <span className="text-amber-500">業:</span>{" "}
              <span className="text-zinc-300">{fragments.sin}</span>
            </div>
          )}
          {fragments.quest && (
            <div>
              <span className="text-amber-500">探求:</span>{" "}
              <span className="text-zinc-300">{fragments.quest}</span>
            </div>
          )}
          {fragments.trait && (
            <div>
              <span className="text-amber-500">癖/性向:</span>{" "}
              <span className="text-zinc-300">{fragments.trait}</span>
            </div>
          )}
        </div>
      </div>

      {/* 経歴テキストエリア */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="biography"
            className="text-sm font-medium text-zinc-400"
          >
            生い立ち
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGeneratingBiography}
            className={`text-sm px-3 py-1 rounded transition-colors ${
              isGeneratingBiography
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
            }`}
          >
            {isGeneratingBiography ? "生成中..." : "再生成"}
          </button>
        </div>

        {isGeneratingBiography ? (
          <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              <p className="text-zinc-400">生い立ちを生成しています...</p>
              <p className="text-zinc-500 text-sm">
                過去から物語を紡いでいます
              </p>
            </div>
          </div>
        ) : (
          <textarea
            id="biography"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            rows={10}
            placeholder="ここに生い立ちが表示されます。生成後、自由に編集できます。"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
          />
        )}

        {biographyError && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 space-y-2">
            <p className="text-red-400 text-sm font-medium">
              生い立ちの生成に失敗しました
            </p>
            <p className="text-zinc-400 text-sm">
              AI生成サービスが利用できない可能性があります。
              上のテキストエリアに直接生い立ちを入力するか、しばらく待ってから再生成をお試しください。
            </p>
          </div>
        )}

        <p className="text-zinc-500 text-sm">
          {biography
            ? "生成された生い立ちは自由に編集できます。約200〜400字程度を推奨します。"
            : "生い立ちを直接入力することもできます。約200〜400字程度を推奨します。"}
        </p>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-lg font-medium border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canProceed || isGeneratingBiography}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canProceed && !isGeneratingBiography
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          次へ：名前と行動指針
        </button>
      </div>
    </div>
  );
}
