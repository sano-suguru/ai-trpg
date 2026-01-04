/**
 * 断片選択ステップ
 *
 * キャラクターの断片（出自、喪失、刻印等）を選択
 */

import { useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  useCharacterCreationStore,
  type FragmentCategory,
} from "@/stores/characterCreation";

// ========================================
// Category Configuration
// ========================================

interface CategoryConfig {
  id: FragmentCategory;
  label: string;
  description: string;
  required: boolean;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "origin",
    label: "出自",
    description: "どこから来たか、何者であったか",
    required: true,
  },
  {
    id: "loss",
    label: "喪失",
    description: "何を失ったか、何が欠けているか",
    required: true,
  },
  {
    id: "mark",
    label: "刻印",
    description: "身体的・外見的特徴、識別できる印",
    required: true,
  },
  {
    id: "sin",
    label: "業",
    description: "抱えている罪/呪い/運命",
    required: false,
  },
  {
    id: "quest",
    label: "探求",
    description: "何を求めているか、目的",
    required: false,
  },
  {
    id: "trait",
    label: "癖/性向",
    description: "振る舞いの特徴、性格的傾向",
    required: false,
  },
];

// ========================================
// Fragment Option Component
// ========================================

interface FragmentOptionProps {
  id: string;
  text: string;
  description?: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FragmentOption({
  text,
  description,
  isSelected,
  onSelect,
}: FragmentOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? "border-amber-500 bg-amber-500/10 text-amber-100"
          : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
      }`}
    >
      <p className="font-medium">{text}</p>
      {description && (
        <p className="text-sm text-zinc-500 mt-1">{description}</p>
      )}
    </button>
  );
}

// ========================================
// Category Section Component
// ========================================

interface CategorySectionProps {
  category: CategoryConfig;
  selectedText: string | null;
  onSelect: (text: string | null) => void;
}

function CategorySection({
  category,
  selectedText,
  onSelect,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(selectedText === null);
  const trpc = useTRPC();

  const fragmentsQuery = useQuery(
    trpc.fragment.listByCategory.queryOptions({ category: category.id }),
  );

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-semibold">{category.label}</span>
          {category.required && (
            <span className="text-xs text-red-400">必須</span>
          )}
          <span className="text-zinc-500 text-sm">{category.description}</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedText && (
            <span className="text-zinc-400 text-sm truncate max-w-48">
              {selectedText}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-2 bg-zinc-900/50">
          {fragmentsQuery.isLoading ? (
            <div className="text-zinc-500 text-center py-4">読み込み中...</div>
          ) : fragmentsQuery.isError ? (
            <div className="text-red-400 text-center py-4">
              読み込みエラーが発生しました
            </div>
          ) : (
            <>
              {!category.required && (
                <FragmentOption
                  id="none"
                  text="選択しない"
                  isSelected={selectedText === null}
                  onSelect={() => {
                    onSelect(null);
                    setIsExpanded(false);
                  }}
                />
              )}
              {fragmentsQuery.data?.map((fragment) => (
                <FragmentOption
                  key={fragment.id}
                  id={fragment.id}
                  text={fragment.text}
                  description={fragment.description}
                  isSelected={selectedText === fragment.text}
                  onSelect={() => {
                    onSelect(fragment.text);
                    setIsExpanded(false);
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// Fragment Step Component
// ========================================

export function FragmentStep() {
  const { fragments, setFragment, canProceedFromFragments, goToNextStep } =
    useCharacterCreationStore();

  const canProceed = canProceedFromFragments();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">過去を選ぶ</h2>
        <p className="text-zinc-400">キャラクターの過去を選んでください</p>
        <p className="text-zinc-500 text-sm mt-1">出自・喪失・刻印は必須です</p>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            selectedText={fragments[category.id]}
            onSelect={(text) => setFragment(category.id, text)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canProceed
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          次へ：生い立ちを生成
        </button>
      </div>
    </div>
  );
}
