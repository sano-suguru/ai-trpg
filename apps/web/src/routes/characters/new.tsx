/**
 * キャラクター作成ページ
 *
 * 4ステップのウィザード形式でキャラクターを作成
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  FragmentStep,
  BiographyStep,
  NameDirectivesStep,
  ConfirmStep,
} from "@/components/character";
import {
  useCharacterCreationStore,
  type WizardStep,
} from "@/stores/characterCreation";

// ========================================
// Route Definition
// ========================================

export const Route = createFileRoute("/characters/new")({
  beforeLoad: async () => {
    // 認証チェック
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: CharacterNewPage,
});

// ========================================
// Step Progress Component
// ========================================

interface StepProgressProps {
  currentStep: WizardStep;
}

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "fragments", label: "断片" },
  { id: "biography", label: "経歴" },
  { id: "nameDirectives", label: "名前・指針" },
  { id: "confirm", label: "確認" },
];

function StepProgress({ currentStep }: StepProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < currentIndex
                  ? "bg-amber-600 text-white"
                  : index === currentIndex
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {index < currentIndex ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-xs mt-1 ${
                index <= currentIndex ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 ${
                index < currentIndex ? "bg-amber-600" : "bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// Page Component
// ========================================

function CharacterNewPage() {
  const { currentStep, reset } = useCharacterCreationStore();

  // ページ離脱時に確認（ブラウザのbeforeunloadイベント）
  // 注: アンマウント時のreset()はConfirmStepの保存成功時に呼ばれるため、ここでは不要
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 何か入力がある場合のみ確認
      const state = useCharacterCreationStore.getState();
      if (
        state.fragments.origin ||
        state.fragments.loss ||
        state.fragments.mark ||
        state.biography
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case "fragments":
        return <FragmentStep />;
      case "biography":
        return <BiographyStep />;
      case "nameDirectives":
        return <NameDirectivesStep />;
      case "confirm":
        return <ConfirmStep />;
      default:
        return <FragmentStep />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            キャラクター作成
          </h1>
          <p className="text-zinc-400">
            断片から物語の主人公を生み出しましょう
          </p>
        </div>

        {/* ステップインジケーター */}
        <StepProgress currentStep={currentStep} />

        {/* ステップコンテンツ */}
        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 p-6">
          {renderStep()}
        </div>

        {/* リセットボタン */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              if (confirm("入力内容をすべてクリアしますか？")) {
                reset();
              }
            }}
            className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    </div>
  );
}
