/**
 * キャラクター作成ウィザードの状態管理
 *
 * 4ステップのウィザード形式でキャラクターを作成
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { logger } from "@/lib/logger";

// ========================================
// Types
// ========================================

/**
 * ウィザードのステップ
 */
export type WizardStep =
  | "fragments"
  | "biography"
  | "nameDirectives"
  | "confirm";

/**
 * 断片カテゴリ
 */
export type FragmentCategory =
  | "origin"
  | "loss"
  | "mark"
  | "sin"
  | "quest"
  | "trait";

/**
 * 選択された断片
 */
export interface SelectedFragments {
  origin: string | null;
  loss: string | null;
  mark: string | null;
  sin: string | null;
  quest: string | null;
  trait: string | null;
}

/**
 * 行動指針カテゴリ
 */
export type DirectiveSituation =
  | "danger"
  | "ally_in_peril"
  | "moral_choice"
  | "unknown";

/**
 * 選択された行動指針
 */
export interface SelectedDirectives {
  danger: string | null;
  allyInPeril: string | null;
  moralChoice: string | null;
  unknown: string | null;
}

/**
 * 生成された名前候補
 */
export interface NameCandidate {
  name: string;
  title: string;
}

/**
 * ストアの状態
 */
interface CharacterCreationState {
  // 現在のステップ
  currentStep: WizardStep;

  // Step 1: 断片選択
  fragments: SelectedFragments;

  // Step 2: 経歴生成
  biography: string;
  isGeneratingBiography: boolean;
  biographyError: string | null;

  // Step 3: 名前・行動指針
  nameCandidates: NameCandidate[];
  selectedName: string;
  selectedTitle: string;
  directives: SelectedDirectives;
  isGeneratingNames: boolean;
  namesError: string | null;

  // 全体の状態
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * ストアのアクション
 */
interface CharacterCreationActions {
  // ナビゲーション
  goToStep: (step: WizardStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Step 1: 断片
  setFragment: (category: FragmentCategory, text: string | null) => void;
  canProceedFromFragments: () => boolean;

  // Step 2: 経歴
  setBiography: (biography: string) => void;
  setIsGeneratingBiography: (isGenerating: boolean) => void;
  setBiographyError: (error: string | null) => void;

  // Step 3: 名前・行動指針
  setNameCandidates: (candidates: NameCandidate[]) => void;
  setSelectedName: (name: string) => void;
  setSelectedTitle: (title: string) => void;
  setDirective: (
    situation: keyof SelectedDirectives,
    text: string | null,
  ) => void;
  setIsGeneratingNames: (isGenerating: boolean) => void;
  setNamesError: (error: string | null) => void;
  canProceedFromNameDirectives: () => boolean;

  // 送信
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error: string | null) => void;

  // リセット
  reset: () => void;

  // 完成したキャラクターデータを取得
  getCharacterData: () => {
    name: string;
    title: string;
    fragments: {
      origin: string;
      loss: string;
      mark: string;
      sin: string | null;
      quest: string | null;
      trait: string | null;
    };
    directives: {
      danger: string;
      allyInPeril: string;
      moralChoice: string;
      unknown: string;
    };
    biography: string;
  } | null;
}

// ========================================
// Initial State
// ========================================

const initialState: CharacterCreationState = {
  currentStep: "fragments",

  fragments: {
    origin: null,
    loss: null,
    mark: null,
    sin: null,
    quest: null,
    trait: null,
  },

  biography: "",
  isGeneratingBiography: false,
  biographyError: null,

  nameCandidates: [],
  selectedName: "",
  selectedTitle: "",
  directives: {
    danger: null,
    allyInPeril: null,
    moralChoice: null,
    unknown: null,
  },
  isGeneratingNames: false,
  namesError: null,

  isSubmitting: false,
  submitError: null,
};

// ========================================
// Step Order
// ========================================

const stepOrder: WizardStep[] = [
  "fragments",
  "biography",
  "nameDirectives",
  "confirm",
];

// ========================================
// Store
// ========================================

export const useCharacterCreationStore = create<
  CharacterCreationState & CharacterCreationActions
>()(
  immer((set, get) => ({
    ...initialState,

    // ========================================
    // Navigation
    // ========================================

    goToStep: (step) => {
      const fromStep = get().currentStep;
      logger.debug("Wizard: Step changed", { from: fromStep, to: step });
      set((state) => {
        state.currentStep = step;
      });
    },

    goToNextStep: () => {
      set((state) => {
        const currentIndex = stepOrder.indexOf(state.currentStep);
        if (currentIndex < stepOrder.length - 1) {
          const nextStep = stepOrder[currentIndex + 1];
          logger.info("Wizard: Moving to next step", {
            from: state.currentStep,
            to: nextStep,
          });
          state.currentStep = nextStep;
        }
      });
    },

    goToPreviousStep: () => {
      set((state) => {
        const currentIndex = stepOrder.indexOf(state.currentStep);
        if (currentIndex > 0) {
          const prevStep = stepOrder[currentIndex - 1];
          logger.debug("Wizard: Moving to previous step", {
            from: state.currentStep,
            to: prevStep,
          });
          state.currentStep = prevStep;
        }
      });
    },

    // ========================================
    // Step 1: Fragments
    // ========================================

    setFragment: (category, text) => {
      logger.debug("Wizard: Fragment selected", { category, text });
      set((state) => {
        state.fragments[category] = text;
      });
    },

    canProceedFromFragments: () => {
      const { fragments } = get();
      // 必須カテゴリ（origin, loss, mark）が全て選択されているか
      return (
        fragments.origin !== null &&
        fragments.loss !== null &&
        fragments.mark !== null
      );
    },

    // ========================================
    // Step 2: Biography
    // ========================================

    setBiography: (biography) => {
      set((state) => {
        state.biography = biography;
      });
    },

    setIsGeneratingBiography: (isGenerating) => {
      set((state) => {
        state.isGeneratingBiography = isGenerating;
      });
    },

    setBiographyError: (error) => {
      if (error) {
        logger.error("Wizard: Biography generation failed", { error });
      }
      set((state) => {
        state.biographyError = error;
      });
    },

    // ========================================
    // Step 3: Name & Directives
    // ========================================

    setNameCandidates: (candidates) => {
      logger.debug("Wizard: Name candidates received", {
        count: candidates.length,
      });
      set((state) => {
        state.nameCandidates = candidates;
      });
    },

    setSelectedName: (name) => {
      set((state) => {
        state.selectedName = name;
      });
    },

    setSelectedTitle: (title) => {
      set((state) => {
        state.selectedTitle = title;
      });
    },

    setDirective: (situation, text) => {
      set((state) => {
        state.directives[situation] = text;
      });
    },

    setIsGeneratingNames: (isGenerating) => {
      set((state) => {
        state.isGeneratingNames = isGenerating;
      });
    },

    setNamesError: (error) => {
      if (error) {
        logger.error("Wizard: Name generation failed", { error });
      }
      set((state) => {
        state.namesError = error;
      });
    },

    canProceedFromNameDirectives: () => {
      const { selectedName, directives } = get();
      return (
        selectedName.trim() !== "" &&
        directives.danger !== null &&
        directives.allyInPeril !== null &&
        directives.moralChoice !== null &&
        directives.unknown !== null
      );
    },

    // ========================================
    // Submit
    // ========================================

    setIsSubmitting: (isSubmitting) => {
      set((state) => {
        state.isSubmitting = isSubmitting;
      });
    },

    setSubmitError: (error) => {
      if (error) {
        logger.error("Wizard: Character creation failed", { error });
      }
      set((state) => {
        state.submitError = error;
      });
    },

    // ========================================
    // Reset
    // ========================================

    reset: () => {
      logger.info("Wizard: State reset");
      set(initialState);
    },

    // ========================================
    // Get Character Data
    // ========================================

    getCharacterData: () => {
      const state = get();

      // バリデーション
      if (
        !state.fragments.origin ||
        !state.fragments.loss ||
        !state.fragments.mark
      ) {
        return null;
      }

      if (
        !state.directives.danger ||
        !state.directives.allyInPeril ||
        !state.directives.moralChoice ||
        !state.directives.unknown
      ) {
        return null;
      }

      if (!state.selectedName.trim()) {
        return null;
      }

      return {
        name: state.selectedName,
        title: state.selectedTitle,
        fragments: {
          origin: state.fragments.origin,
          loss: state.fragments.loss,
          mark: state.fragments.mark,
          sin: state.fragments.sin,
          quest: state.fragments.quest,
          trait: state.fragments.trait,
        },
        directives: {
          danger: state.directives.danger,
          allyInPeril: state.directives.allyInPeril,
          moralChoice: state.directives.moralChoice,
          unknown: state.directives.unknown,
        },
        biography: state.biography,
      };
    },
  })),
);
