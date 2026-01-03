/**
 * 行動指針（Directive）マスターデータ
 *
 * キャラクター作成時に選択可能な行動指針の候補一覧
 * docs/design.md の行動指針に基づく
 */

import type { DirectiveSituation } from "../domain/character";

// ========================================
// Directive Master Data Types
// ========================================

/**
 * 行動指針選択肢の定義
 */
export interface DirectiveOption {
  /** 選択肢ID */
  readonly id: string;
  /** 行動指針のテキスト */
  readonly text: string;
  /** どの状況に対する選択肢か */
  readonly situation: DirectiveSituation;
  /** 説明（UIでの補足表示用、任意） */
  readonly description?: string;
}

// ========================================
// Danger Directive Options (危険を前にしたとき)
// ========================================

export const DANGER_DIRECTIVE_OPTIONS: readonly DirectiveOption[] = [
  {
    id: "danger-001",
    situation: "danger",
    text: "迷わず前に出る",
    description: "危険を恐れず、真っ先に立ち向かう",
  },
  {
    id: "danger-002",
    situation: "danger",
    text: "慎重に状況を見極める",
    description: "まずは情報を集め、最善の手を探る",
  },
  {
    id: "danger-003",
    situation: "danger",
    text: "仲間を下がらせ、殿を務める",
    description: "自分が盾となり、仲間を逃がす",
  },
  {
    id: "danger-004",
    situation: "danger",
    text: "逃げ道を探す",
    description: "生き残ることを最優先にする",
  },
  {
    id: "danger-005",
    situation: "danger",
    text: "話し合いを試みる",
    description: "戦わずに済む道を探す",
  },
] as const;

// ========================================
// Ally In Peril Directive Options (仲間が窮地に陥ったとき)
// ========================================

export const ALLY_IN_PERIL_DIRECTIVE_OPTIONS: readonly DirectiveOption[] = [
  {
    id: "ally-001",
    situation: "ally_in_peril",
    text: "何を犠牲にしても助ける",
    description: "自分の命を懸けてでも仲間を救う",
  },
  {
    id: "ally-002",
    situation: "ally_in_peril",
    text: "助けたいが、無謀はしない",
    description: "できる限りのことはするが、限界は弁える",
  },
  {
    id: "ally-003",
    situation: "ally_in_peril",
    text: "冷静に最善手を探す",
    description: "感情に流されず、最も効果的な方法を考える",
  },
  {
    id: "ally-004",
    situation: "ally_in_peril",
    text: "自分の身を優先する（生き延びてこそ）",
    description: "共倒れは避ける、生きて次に繋ぐ",
  },
  {
    id: "ally-005",
    situation: "ally_in_peril",
    text: "怒りで我を忘れる",
    description: "仲間を傷つけた者への怒りが理性を上回る",
  },
] as const;

// ========================================
// Moral Choice Directive Options (道徳的選択を迫られたとき)
// ========================================

export const MORAL_CHOICE_DIRECTIVE_OPTIONS: readonly DirectiveOption[] = [
  {
    id: "moral-001",
    situation: "moral_choice",
    text: "正しいと信じる道を選ぶ",
    description: "己の信念に従い、正義を貫く",
  },
  {
    id: "moral-002",
    situation: "moral_choice",
    text: "現実的な利を取る",
    description: "理想より実利を優先する",
  },
  {
    id: "moral-003",
    situation: "moral_choice",
    text: "弱い者の側に立つ",
    description: "力なき者を守ることを選ぶ",
  },
  {
    id: "moral-004",
    situation: "moral_choice",
    text: "誰かに判断を委ねる",
    description: "自分では決められない、他者に託す",
  },
  {
    id: "moral-005",
    situation: "moral_choice",
    text: "選ばない（両方壊す/逃げる）",
    description: "どちらも選べないなら、第三の道を",
  },
] as const;

// ========================================
// Unknown Directive Options (未知のものに遭遇したとき)
// ========================================

export const UNKNOWN_DIRECTIVE_OPTIONS: readonly DirectiveOption[] = [
  {
    id: "unknown-001",
    situation: "unknown",
    text: "好奇心が恐怖に勝つ",
    description: "知りたいという欲求が足を進ませる",
  },
  {
    id: "unknown-002",
    situation: "unknown",
    text: "警戒し、距離を取る",
    description: "分からないものには近づかない",
  },
  {
    id: "unknown-003",
    situation: "unknown",
    text: "知識で対処しようとする",
    description: "既知の情報から対応策を導く",
  },
  {
    id: "unknown-004",
    situation: "unknown",
    text: "とりあえず触ってみる",
    description: "まず行動、考えるのは後",
  },
  {
    id: "unknown-005",
    situation: "unknown",
    text: "仲間に任せる",
    description: "自分より適任がいるなら譲る",
  },
] as const;

// ========================================
// All Directive Options by Situation
// ========================================

export const DIRECTIVE_OPTIONS = {
  danger: DANGER_DIRECTIVE_OPTIONS,
  ally_in_peril: ALLY_IN_PERIL_DIRECTIVE_OPTIONS,
  moral_choice: MORAL_CHOICE_DIRECTIVE_OPTIONS,
  unknown: UNKNOWN_DIRECTIVE_OPTIONS,
} as const;

// ========================================
// Utility Functions
// ========================================

/**
 * 状況から行動指針選択肢を取得
 */
export function getDirectivesBySituation(
  situation: DirectiveSituation,
): readonly DirectiveOption[] {
  return DIRECTIVE_OPTIONS[situation];
}

/**
 * IDから行動指針選択肢を取得
 */
export function getDirectiveById(id: string): DirectiveOption | undefined {
  for (const directives of Object.values(DIRECTIVE_OPTIONS)) {
    const found = directives.find((d) => d.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * 状況の日本語ラベル
 */
export const DIRECTIVE_SITUATION_LABELS: Record<DirectiveSituation, string> = {
  danger: "危険を前にしたとき",
  ally_in_peril: "仲間が窮地に陥ったとき",
  moral_choice: "道徳的選択を迫られたとき",
  unknown: "未知のものに遭遇したとき",
} as const;

/**
 * 全ての状況を順序付きで取得
 */
export const DIRECTIVE_SITUATIONS_ORDER: readonly DirectiveSituation[] = [
  "danger",
  "ally_in_peril",
  "moral_choice",
  "unknown",
] as const;
