/**
 * 名前・行動指針選択ステップ
 *
 * AIによる名前候補生成と行動指針の選択
 */

import { useEffect, useRef, useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useCharacterCreationStore,
  type SelectedDirectives,
} from "@/stores/characterCreation";

// ========================================
// Directive Configuration
// ========================================

interface DirectiveConfig {
  key: keyof SelectedDirectives;
  label: string;
  description: string;
  apiSituation: "danger" | "ally_in_peril" | "moral_choice" | "unknown";
}

const DIRECTIVE_CONFIGS: DirectiveConfig[] = [
  {
    key: "danger",
    label: "危険を前にしたとき",
    description: "脅威や危機的状況に直面したときの行動",
    apiSituation: "danger",
  },
  {
    key: "allyInPeril",
    label: "仲間が窮地に陥ったとき",
    description: "仲間が危険にさらされたときの行動",
    apiSituation: "ally_in_peril",
  },
  {
    key: "moralChoice",
    label: "道徳的選択を迫られたとき",
    description: "正しいことと現実的なことの狭間で",
    apiSituation: "moral_choice",
  },
  {
    key: "unknown",
    label: "未知のものに遭遇したとき",
    description: "理解できないものに出会ったとき",
    apiSituation: "unknown",
  },
];

// ========================================
// Name Input Section
// ========================================

function NameInputSection() {
  const {
    fragments,
    biography,
    nameCandidates,
    setNameCandidates,
    selectedName,
    setSelectedName,
    selectedTitle,
    setSelectedTitle,
    isGeneratingNames,
    setIsGeneratingNames,
    namesError,
    setNamesError,
  } = useCharacterCreationStore();

  const [showCandidates, setShowCandidates] = useState(true);

  const trpc = useTRPC();

  // 自動生成の重複実行を防ぐためのフラグ
  const hasTriggeredAutoGenerate = useRef(false);

  // 名前生成ミューテーション
  const generateNamesMutation = useMutation(
    trpc.character.generateNames.mutationOptions({
      onSuccess: (data) => {
        // 名前を解析して候補リストに変換
        const candidates = data.names.map((name) => {
          // "〇〇の△△" 形式を解析
          const match = name.match(/(.+?)の(.+)/);
          if (match) {
            return { title: match[1], name: match[2] };
          }
          return { title: "", name };
        });
        setNameCandidates(candidates);
        setIsGeneratingNames(false);
        setNamesError(null);
        setShowCandidates(true);
      },
      onError: (error) => {
        setIsGeneratingNames(false);
        setNamesError(error.message);
      },
    }),
  );

  // 初回マウント時に名前候補が空なら自動生成
  // refで重複実行を防ぎ、依存配列を正しく設定
  useEffect(() => {
    if (
      !hasTriggeredAutoGenerate.current &&
      nameCandidates.length === 0 &&
      !isGeneratingNames &&
      biography &&
      fragments.origin &&
      fragments.loss &&
      fragments.mark
    ) {
      hasTriggeredAutoGenerate.current = true;
      // handleGenerateではなく直接mutateを呼ぶ（依存関係を単純化）
      setIsGeneratingNames(true);
      setNamesError(null);
      generateNamesMutation.mutate({
        fragments: {
          origin: fragments.origin,
          loss: fragments.loss,
          mark: fragments.mark,
          sin: fragments.sin,
          quest: fragments.quest,
          trait: fragments.trait,
        },
        biography,
      });
    }
  }, [
    nameCandidates.length,
    isGeneratingNames,
    biography,
    fragments.origin,
    fragments.loss,
    fragments.mark,
    fragments.sin,
    fragments.quest,
    fragments.trait,
    setIsGeneratingNames,
    setNamesError,
    generateNamesMutation,
  ]);

  const handleGenerate = () => {
    if (!fragments.origin || !fragments.loss || !fragments.mark || !biography) {
      setNamesError("必須情報が不足しています");
      return;
    }

    setIsGeneratingNames(true);
    setNamesError(null);

    generateNamesMutation.mutate({
      fragments: {
        origin: fragments.origin,
        loss: fragments.loss,
        mark: fragments.mark,
        sin: fragments.sin,
        quest: fragments.quest,
        trait: fragments.trait,
      },
      biography,
    });
  };

  const handleSelectCandidate = (candidate: {
    name: string;
    title: string;
  }) => {
    setSelectedName(candidate.name);
    setSelectedTitle(candidate.title);
    setShowCandidates(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-200">名前</h3>

      {/* 名前候補 */}
      {showCandidates && nameCandidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">候補から選ぶ:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nameCandidates.map(
              (candidate: { name: string; title: string }) => (
                <button
                  key={`${candidate.title}-${candidate.name}`}
                  type="button"
                  onClick={() => handleSelectCandidate(candidate)}
                  className="text-left p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:border-amber-500/50 hover:bg-zinc-800 transition-colors"
                >
                  {candidate.title ? (
                    <span className="text-zinc-200">
                      {candidate.title}の
                      <span className="text-amber-400">{candidate.name}</span>
                    </span>
                  ) : (
                    <span className="text-amber-400">{candidate.name}</span>
                  )}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {isGeneratingNames && (
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
          <span className="text-zinc-400">名前候補を生成中...</span>
        </div>
      )}

      {namesError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 space-y-1">
          <p className="text-red-400 text-sm font-medium">
            名前候補の生成に失敗しました
          </p>
          <p className="text-zinc-400 text-xs">
            下のフォームから直接入力してください。
          </p>
        </div>
      )}

      {/* 手動入力 */}
      <div className="space-y-3 pt-2">
        <p className="text-sm text-zinc-400">
          {nameCandidates.length > 0
            ? "または自分で入力（選択後も編集可能）:"
            : "名前を入力してください:"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="title" className="block text-sm text-zinc-500 mb-1">
              二つ名/通り名（任意）
            </label>
            <input
              id="title"
              type="text"
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              placeholder="灰村、朽ちた塔、など"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-500 mb-1">
              名前
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              placeholder="セド、エレン、リラ、など"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
        </div>
        {selectedTitle && selectedName && (
          <p className="text-amber-400">
            {selectedTitle}の{selectedName}
          </p>
        )}
        {!selectedTitle && selectedName && (
          <p className="text-amber-400">{selectedName}</p>
        )}
      </div>

      {/* 再生成ボタン */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGeneratingNames}
        className={`text-sm px-3 py-1 rounded transition-colors ${
          isGeneratingNames
            ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            : "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
        }`}
      >
        {isGeneratingNames ? "生成中..." : "名前候補を再生成"}
      </button>
    </div>
  );
}

// ========================================
// Directive Section
// ========================================

interface DirectiveSectionProps {
  config: DirectiveConfig;
  selectedText: string | null;
  onSelect: (text: string | null) => void;
}

function DirectiveSection({
  config,
  selectedText,
  onSelect,
}: DirectiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(selectedText === null);
  const trpc = useTRPC();

  const directivesQuery = useQuery(
    trpc.directive.listBySituation.queryOptions({
      situation: config.apiSituation,
    }),
  );

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-medium text-sm">
            {config.label}
          </span>
          {selectedText && (
            <span className="text-green-500 text-xs">選択済み</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 bg-zinc-900/50">
          <p className="text-xs text-zinc-500 mb-2">{config.description}</p>
          {directivesQuery.isLoading ? (
            <div className="text-zinc-500 text-center py-2 text-sm">
              読み込み中...
            </div>
          ) : directivesQuery.isError ? (
            <div className="text-red-400 text-center py-2 text-sm">
              読み込みエラー
            </div>
          ) : (
            directivesQuery.data?.map((directive) => (
              <button
                key={directive.id}
                type="button"
                onClick={() => {
                  onSelect(directive.text);
                  setIsExpanded(false);
                }}
                className={`w-full text-left p-2 rounded border transition-all text-sm ${
                  selectedText === directive.text
                    ? "border-amber-500 bg-amber-500/10 text-amber-100"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <p>{directive.text}</p>
                {directive.description && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {directive.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {!isExpanded && selectedText && (
        <div className="px-3 py-2 bg-zinc-900/30 text-sm text-zinc-300 border-t border-zinc-800">
          {selectedText}
        </div>
      )}
    </div>
  );
}

// ========================================
// Name Directives Step Component
// ========================================

export function NameDirectivesStep() {
  const {
    directives,
    setDirective,
    canProceedFromNameDirectives,
    goToNextStep,
    goToPreviousStep,
    isGeneratingNames,
  } = useCharacterCreationStore();

  const canProceed = canProceedFromNameDirectives();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          名前と行動指針
        </h2>
        <p className="text-zinc-400">
          キャラクターの名前と、困難な状況での振る舞いを決めます
        </p>
      </div>

      {/* 名前入力セクション */}
      <NameInputSection />

      {/* 行動指針セクション */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-zinc-200">
          行動指針
          <span className="text-sm font-normal text-zinc-500 ml-2">
            全て選択してください
          </span>
        </h3>

        <div className="space-y-3">
          {DIRECTIVE_CONFIGS.map((config) => (
            <DirectiveSection
              key={config.key}
              config={config}
              selectedText={directives[config.key]}
              onSelect={(text) => setDirective(config.key, text)}
            />
          ))}
        </div>
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
          disabled={!canProceed || isGeneratingNames}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canProceed && !isGeneratingNames
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          次へ：確認
        </button>
      </div>
    </div>
  );
}
