/**
 * キャラクター行動指針（Directive）型定義
 *
 * 行動指針はAIがセッション中に「このキャラならどう動くか」を判断するための軸
 * 4つの状況全てに対する指針が必須
 */

import { Result, ok, err } from "neverthrow";
import { Brand, asBrand } from "../../lib/brand";
import { Errors, ValidationError } from "../../types/errors";

// ========================================
// Directive Situations
// ========================================

/**
 * 行動指針を設定する4つの場面
 */
export const DirectiveSituations = {
  /** 危険を前にしたとき */
  DANGER: "danger",
  /** 仲間が窮地に陥ったとき */
  ALLY_IN_PERIL: "ally_in_peril",
  /** 道徳的選択を迫られたとき */
  MORAL_CHOICE: "moral_choice",
  /** 未知のものに遭遇したとき */
  UNKNOWN: "unknown",
} as const;

export type DirectiveSituation =
  (typeof DirectiveSituations)[keyof typeof DirectiveSituations];

// ========================================
// Directive Response Value Object
// ========================================

/** 行動指針レスポンスのBranded Type */
export type DirectiveResponse = Brand<string, "DirectiveResponse">;

const DIRECTIVE_MIN_LENGTH = 1;
const DIRECTIVE_MAX_LENGTH = 200;

/**
 * 行動指針レスポンスを生成（バリデーション付き）
 */
export function createDirectiveResponse(
  value: string
): Result<DirectiveResponse, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length < DIRECTIVE_MIN_LENGTH) {
    return err(Errors.validation("行動指針は必須です", "directive"));
  }

  if (trimmed.length > DIRECTIVE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `行動指針は${DIRECTIVE_MAX_LENGTH}文字以内にしてください`,
        "directive"
      )
    );
  }

  return ok(asBrand<"DirectiveResponse">(trimmed));
}

// ========================================
// Individual Directive Types
// ========================================

/** 危険時の行動指針 */
export interface DangerDirective {
  readonly situation: typeof DirectiveSituations.DANGER;
  readonly response: DirectiveResponse;
}

/** 仲間窮地時の行動指針 */
export interface AllyInPerilDirective {
  readonly situation: typeof DirectiveSituations.ALLY_IN_PERIL;
  readonly response: DirectiveResponse;
}

/** 道徳的選択時の行動指針 */
export interface MoralChoiceDirective {
  readonly situation: typeof DirectiveSituations.MORAL_CHOICE;
  readonly response: DirectiveResponse;
}

/** 未知遭遇時の行動指針 */
export interface UnknownDirective {
  readonly situation: typeof DirectiveSituations.UNKNOWN;
  readonly response: DirectiveResponse;
}

/** 全行動指針の判別共用体 */
export type Directive =
  | DangerDirective
  | AllyInPerilDirective
  | MoralChoiceDirective
  | UnknownDirective;

// ========================================
// Character Directives Aggregate
// ========================================

/**
 * キャラクター行動指針の集約
 *
 * 全4つの状況に対する指針が必須
 */
export interface CharacterDirectives {
  readonly danger: DangerDirective;
  readonly allyInPeril: AllyInPerilDirective;
  readonly moralChoice: MoralChoiceDirective;
  readonly unknown: UnknownDirective;
}

// ========================================
// Directive Smart Constructors
// ========================================

export function createDangerDirective(
  response: string
): Result<DangerDirective, ValidationError> {
  return createDirectiveResponse(response).map((r) => ({
    situation: DirectiveSituations.DANGER,
    response: r,
  }));
}

export function createAllyInPerilDirective(
  response: string
): Result<AllyInPerilDirective, ValidationError> {
  return createDirectiveResponse(response).map((r) => ({
    situation: DirectiveSituations.ALLY_IN_PERIL,
    response: r,
  }));
}

export function createMoralChoiceDirective(
  response: string
): Result<MoralChoiceDirective, ValidationError> {
  return createDirectiveResponse(response).map((r) => ({
    situation: DirectiveSituations.MORAL_CHOICE,
    response: r,
  }));
}

export function createUnknownDirective(
  response: string
): Result<UnknownDirective, ValidationError> {
  return createDirectiveResponse(response).map((r) => ({
    situation: DirectiveSituations.UNKNOWN,
    response: r,
  }));
}

// ========================================
// CharacterDirectives Smart Constructor
// ========================================

/**
 * CharacterDirectives生成用の入力型
 */
export interface CreateDirectivesInput {
  readonly danger: string;
  readonly allyInPeril: string;
  readonly moralChoice: string;
  readonly unknown: string;
}

/**
 * CharacterDirectivesを生成（バリデーション付き）
 */
export function createCharacterDirectives(
  input: CreateDirectivesInput
): Result<CharacterDirectives, ValidationError> {
  const dangerResult = createDangerDirective(input.danger);
  if (dangerResult.isErr()) {
    return err(
      Errors.validation(dangerResult.error.message, "directives.danger")
    );
  }

  const allyResult = createAllyInPerilDirective(input.allyInPeril);
  if (allyResult.isErr()) {
    return err(
      Errors.validation(allyResult.error.message, "directives.allyInPeril")
    );
  }

  const moralResult = createMoralChoiceDirective(input.moralChoice);
  if (moralResult.isErr()) {
    return err(
      Errors.validation(moralResult.error.message, "directives.moralChoice")
    );
  }

  const unknownResult = createUnknownDirective(input.unknown);
  if (unknownResult.isErr()) {
    return err(
      Errors.validation(unknownResult.error.message, "directives.unknown")
    );
  }

  return ok({
    danger: dangerResult.value,
    allyInPeril: allyResult.value,
    moralChoice: moralResult.value,
    unknown: unknownResult.value,
  });
}

// ========================================
// Directive Utilities
// ========================================

/**
 * 行動指針をプレーンオブジェクトに変換（DB保存用）
 */
export function directivesToPlain(directives: CharacterDirectives): {
  danger: string;
  ally_in_peril: string;
  moral_choice: string;
  unknown: string;
} {
  return {
    danger: directives.danger.response as string,
    ally_in_peril: directives.allyInPeril.response as string,
    moral_choice: directives.moralChoice.response as string,
    unknown: directives.unknown.response as string,
  };
}

/**
 * 状況を日本語で取得
 */
export function getDirectiveSituationLabel(
  situation: DirectiveSituation
): string {
  const labels: Record<DirectiveSituation, string> = {
    danger: "危険を前にしたとき",
    ally_in_peril: "仲間が窮地に陥ったとき",
    moral_choice: "道徳的選択を迫られたとき",
    unknown: "未知のものに遭遇したとき",
  };
  return labels[situation];
}

// ========================================
// Default Directive Options
// ========================================

/**
 * 危険時の選択肢
 */
export const DangerOptions = [
  "迷わず前に出る",
  "慎重に状況を見極める",
  "仲間を下がらせ、殿を務める",
  "逃げ道を探す",
  "話し合いを試みる",
] as const;

/**
 * 仲間窮地時の選択肢
 */
export const AllyInPerilOptions = [
  "何を犠牲にしても助ける",
  "助けたいが、無謀はしない",
  "冷静に最善手を探す",
  "自分の身を優先する（生き延びてこそ）",
  "怒りで我を忘れる",
] as const;

/**
 * 道徳的選択時の選択肢
 */
export const MoralChoiceOptions = [
  "正しいと信じる道を選ぶ",
  "現実的な利を取る",
  "弱い者の側に立つ",
  "誰かに判断を委ねる",
  "選ばない（両方壊す/逃げる）",
] as const;

/**
 * 未知遭遇時の選択肢
 */
export const UnknownOptions = [
  "好奇心が恐怖に勝つ",
  "警戒し、距離を取る",
  "知識で対処しようとする",
  "とりあえず触ってみる",
  "仲間に任せる",
] as const;
