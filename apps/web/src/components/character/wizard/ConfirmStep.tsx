/**
 * 確認ステップ
 *
 * キャラクター情報の最終確認と保存
 */

import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { useCharacterCreationStore } from "@/stores/characterCreation";

// ========================================
// Confirm Step Component
// ========================================

export function ConfirmStep() {
  const navigate = useNavigate();
  const {
    fragments,
    biography,
    selectedName,
    selectedTitle,
    directives,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
    goToPreviousStep,
    getCharacterData,
    reset,
  } = useCharacterCreationStore();

  const trpc = useTRPC();

  // キャラクター作成ミューテーション
  const createCharacterMutation = useMutation(
    trpc.character.create.mutationOptions({
      onSuccess: (data) => {
        setIsSubmitting(false);
        reset();
        // 作成したキャラクターの詳細ページへ遷移
        navigate({ to: "/characters/$id", params: { id: data.id } });
      },
      onError: (error) => {
        setIsSubmitting(false);
        setSubmitError(error.message);
      },
    }),
  );

  const handleSubmit = () => {
    const characterData = getCharacterData();
    if (!characterData) {
      setSubmitError("キャラクターデータが不完全です");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // 名前のフォーマット
    const fullName = selectedTitle
      ? `${selectedTitle}の${selectedName}`
      : selectedName;

    createCharacterMutation.mutate({
      name: fullName,
      title: selectedTitle || "",
      fragments: characterData.fragments,
      directives: characterData.directives,
      biography: characterData.biography,
      lending: "safe", // デフォルト値
      isPublic: false, // デフォルト値
    });
  };

  // 行動指針のラベル
  const directiveLabels: Record<string, string> = {
    danger: "危険を前にしたとき",
    allyInPeril: "仲間が窮地に陥ったとき",
    moralChoice: "道徳的選択を迫られたとき",
    unknown: "未知のものに遭遇したとき",
  };

  // 断片のラベル
  const fragmentLabels: Record<string, string> = {
    origin: "出自",
    loss: "喪失",
    mark: "刻印",
    sin: "業",
    quest: "探求",
    trait: "癖/性向",
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">確認</h2>
        <p className="text-zinc-400">キャラクターの情報を確認してください</p>
      </div>

      {/* 名前 */}
      <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
        <div className="text-center">
          {selectedTitle && (
            <p className="text-zinc-400 text-sm mb-1">{selectedTitle}の</p>
          )}
          <h3 className="text-3xl font-bold text-amber-400">{selectedName}</h3>
        </div>
      </div>

      {/* 過去 */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">過去</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(fragments)
            .filter(([, value]) => value !== null)
            .map(([key, value]) => (
              <div
                key={key}
                className="bg-zinc-900/50 rounded p-3 border border-zinc-700/50"
              >
                <span className="text-amber-500 text-sm font-medium">
                  {fragmentLabels[key]}
                </span>
                <p className="text-zinc-200 mt-1">{value}</p>
              </div>
            ))}
        </div>
      </div>

      {/* 生い立ち */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">生い立ち</h4>
        <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
          {biography}
        </p>
      </div>

      {/* 行動指針 */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <h4 className="text-sm font-medium text-zinc-400 mb-3">行動指針</h4>
        <div className="space-y-3">
          {Object.entries(directives)
            .filter(([, value]) => value !== null)
            .map(([key, value]) => (
              <div
                key={key}
                className="bg-zinc-900/50 rounded p-3 border border-zinc-700/50"
              >
                <span className="text-amber-500 text-sm font-medium">
                  {directiveLabels[key]}
                </span>
                <p className="text-zinc-200 mt-1">{value}</p>
              </div>
            ))}
        </div>
      </div>

      {/* エラーメッセージ */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{submitError}</p>
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-8 py-2 rounded-lg font-medium transition-colors ${
            isSubmitting
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              作成中...
            </span>
          ) : (
            "キャラクターを作成"
          )}
        </button>
      </div>
    </div>
  );
}
