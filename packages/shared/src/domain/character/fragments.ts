/**
 * キャラクター断片（Fragment）型定義
 *
 * 断片はキャラクターの物語的背景を構成する要素
 * - 必須: origin（出自）, loss（喪失）, mark（刻印）
 * - 任意: sin（業）, quest（探求）, trait（癖/性向）
 */

import { Result, ok, err } from "neverthrow";
import { Brand, asBrand } from "../../lib/brand";
import { Errors, ValidationError } from "../../types/errors";

// ========================================
// Fragment Categories
// ========================================

/**
 * 断片カテゴリの定数
 */
export const FragmentCategories = {
  /** 出自 - どこから来たか */
  ORIGIN: "origin",
  /** 喪失 - 何を失ったか */
  LOSS: "loss",
  /** 刻印 - 身体的・外見的特徴 */
  MARK: "mark",
  /** 業 - 抱えている罪/呪い/運命 */
  SIN: "sin",
  /** 探求 - 何を求めているか */
  QUEST: "quest",
  /** 癖/性向 - 振る舞いの特徴 */
  TRAIT: "trait",
} as const;

export type FragmentCategory =
  (typeof FragmentCategories)[keyof typeof FragmentCategories];

// ========================================
// Fragment Text Value Object
// ========================================

/** 断片テキストのBranded Type */
export type FragmentText = Brand<string, "FragmentText">;

const FRAGMENT_MIN_LENGTH = 5;
const FRAGMENT_MAX_LENGTH = 200;

/**
 * 断片テキストを生成（バリデーション付き）
 */
export function createFragmentText(
  value: string,
): Result<FragmentText, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length < FRAGMENT_MIN_LENGTH) {
    return err(
      Errors.validation(
        `断片は${FRAGMENT_MIN_LENGTH}文字以上必要です`,
        "fragment",
      ),
    );
  }

  if (trimmed.length > FRAGMENT_MAX_LENGTH) {
    return err(
      Errors.validation(
        `断片は${FRAGMENT_MAX_LENGTH}文字以内にしてください`,
        "fragment",
      ),
    );
  }

  return ok(asBrand<"FragmentText">(trimmed));
}

// ========================================
// Individual Fragment Types
// ========================================

/** 出自断片 */
export interface OriginFragment {
  readonly category: typeof FragmentCategories.ORIGIN;
  readonly text: FragmentText;
}

/** 喪失断片 */
export interface LossFragment {
  readonly category: typeof FragmentCategories.LOSS;
  readonly text: FragmentText;
}

/** 刻印断片 */
export interface MarkFragment {
  readonly category: typeof FragmentCategories.MARK;
  readonly text: FragmentText;
}

/** 業断片 */
export interface SinFragment {
  readonly category: typeof FragmentCategories.SIN;
  readonly text: FragmentText;
}

/** 探求断片 */
export interface QuestFragment {
  readonly category: typeof FragmentCategories.QUEST;
  readonly text: FragmentText;
}

/** 癖/性向断片 */
export interface TraitFragment {
  readonly category: typeof FragmentCategories.TRAIT;
  readonly text: FragmentText;
}

/** 全断片の判別共用体 */
export type Fragment =
  | OriginFragment
  | LossFragment
  | MarkFragment
  | SinFragment
  | QuestFragment
  | TraitFragment;

// ========================================
// Character Fragments Aggregate
// ========================================

/**
 * キャラクター断片の集約
 *
 * この型により、必須断片が欠けたキャラクターは型エラーになる
 * - origin, loss, mark は必須
 * - sin, quest, trait は任意（null許容）
 */
export interface CharacterFragments {
  readonly origin: OriginFragment;
  readonly loss: LossFragment;
  readonly mark: MarkFragment;
  readonly sin: SinFragment | null;
  readonly quest: QuestFragment | null;
  readonly trait: TraitFragment | null;
}

// ========================================
// Fragment Smart Constructors
// ========================================

export function createOriginFragment(
  text: string,
): Result<OriginFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.ORIGIN,
    text: fragmentText,
  }));
}

export function createLossFragment(
  text: string,
): Result<LossFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.LOSS,
    text: fragmentText,
  }));
}

export function createMarkFragment(
  text: string,
): Result<MarkFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.MARK,
    text: fragmentText,
  }));
}

export function createSinFragment(
  text: string,
): Result<SinFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.SIN,
    text: fragmentText,
  }));
}

export function createQuestFragment(
  text: string,
): Result<QuestFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.QUEST,
    text: fragmentText,
  }));
}

export function createTraitFragment(
  text: string,
): Result<TraitFragment, ValidationError> {
  return createFragmentText(text).map((fragmentText) => ({
    category: FragmentCategories.TRAIT,
    text: fragmentText,
  }));
}

// ========================================
// CharacterFragments Smart Constructor
// ========================================

/**
 * CharacterFragments生成用の入力型
 */
export interface CreateFragmentsInput {
  readonly origin: string;
  readonly loss: string;
  readonly mark: string;
  readonly sin?: string | null;
  readonly quest?: string | null;
  readonly trait?: string | null;
}

/**
 * CharacterFragmentsを生成（バリデーション付き）
 *
 * 必須断片のバリデーションに失敗した場合はエラーを返す
 * 任意断片のバリデーションに失敗した場合はnullとして扱う
 */
export function createCharacterFragments(
  input: CreateFragmentsInput,
): Result<CharacterFragments, ValidationError> {
  // 必須断片のバリデーション
  const originResult = createOriginFragment(input.origin);
  if (originResult.isErr()) {
    return err(
      Errors.validation(originResult.error.message, "fragments.origin"),
    );
  }

  const lossResult = createLossFragment(input.loss);
  if (lossResult.isErr()) {
    return err(Errors.validation(lossResult.error.message, "fragments.loss"));
  }

  const markResult = createMarkFragment(input.mark);
  if (markResult.isErr()) {
    return err(Errors.validation(markResult.error.message, "fragments.mark"));
  }

  // 任意断片（失敗時はnull）
  const sin =
    input.sin && input.sin.trim().length > 0
      ? createSinFragment(input.sin).match(
          (f) => f,
          () => null,
        )
      : null;

  const quest =
    input.quest && input.quest.trim().length > 0
      ? createQuestFragment(input.quest).match(
          (f) => f,
          () => null,
        )
      : null;

  const trait =
    input.trait && input.trait.trim().length > 0
      ? createTraitFragment(input.trait).match(
          (f) => f,
          () => null,
        )
      : null;

  return ok({
    origin: originResult.value,
    loss: lossResult.value,
    mark: markResult.value,
    sin,
    quest,
    trait,
  });
}

// ========================================
// Fragment Utilities
// ========================================

/**
 * 断片をプレーンオブジェクトに変換（DB保存用）
 */
export function fragmentsToPlain(fragments: CharacterFragments): {
  origin: string;
  loss: string;
  mark: string;
  sin: string | null;
  quest: string | null;
  trait: string | null;
} {
  return {
    origin: fragments.origin.text as string,
    loss: fragments.loss.text as string,
    mark: fragments.mark.text as string,
    sin: fragments.sin ? (fragments.sin.text as string) : null,
    quest: fragments.quest ? (fragments.quest.text as string) : null,
    trait: fragments.trait ? (fragments.trait.text as string) : null,
  };
}

/**
 * 断片のカテゴリを日本語で取得
 */
export function getFragmentCategoryLabel(category: FragmentCategory): string {
  const labels: Record<FragmentCategory, string> = {
    origin: "出自",
    loss: "喪失",
    mark: "刻印",
    sin: "業",
    quest: "探求",
    trait: "癖/性向",
  };
  return labels[category];
}
