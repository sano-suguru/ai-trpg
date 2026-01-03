/**
 * 断片（Fragment）マスターデータ
 *
 * キャラクター作成時に選択可能な断片の候補一覧
 * docs/design.md の断片カテゴリに基づく
 */

import type { FragmentCategory } from "../domain/character";

// ========================================
// Fragment Master Data Types
// ========================================

/**
 * 断片候補の定義
 */
export interface FragmentOption {
  /** 断片ID（選択時の識別子） */
  readonly id: string;
  /** 断片のテキスト */
  readonly text: string;
  /** カテゴリ */
  readonly category: FragmentCategory;
  /** 説明（UIでの補足表示用、任意） */
  readonly description?: string;
}

// ========================================
// Origin Fragments (出自) - 必須
// ========================================

export const ORIGIN_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "origin-001",
    category: "origin",
    text: "灰燼の街の生き残り",
    description: "大火で滅んだ街の数少ない生存者",
  },
  {
    id: "origin-002",
    category: "origin",
    text: "処刑人の家系に生まれた",
    description: "代々死を与える役目を担ってきた血筋",
  },
  {
    id: "origin-003",
    category: "origin",
    text: "神殿に捨てられていた子",
    description: "神域の入り口で発見された捨て子",
  },
  {
    id: "origin-004",
    category: "origin",
    text: "傭兵団で育った孤児",
    description: "戦場を家として育った",
  },
  {
    id: "origin-005",
    category: "origin",
    text: "没落貴族の末裔",
    description: "かつての栄光の残滓を引きずる",
  },
  {
    id: "origin-006",
    category: "origin",
    text: "魔女に育てられた",
    description: "森の奥で人ならざる者に養われた",
  },
  {
    id: "origin-007",
    category: "origin",
    text: "奴隷市場から逃げ出した",
    description: "鎖を断ち切り自由を掴んだ",
  },
  {
    id: "origin-008",
    category: "origin",
    text: "死体の山から目覚めた（記憶なし）",
    description: "最初の記憶は血と屍の臭い",
  },
  {
    id: "origin-009",
    category: "origin",
    text: "国境の森に住む民の出",
    description: "文明から隔絶された土地で生まれた",
  },
  {
    id: "origin-010",
    category: "origin",
    text: "異端審問で家族を失った村の子",
    description: "信仰の名のもとに全てを奪われた",
  },
] as const;

// ========================================
// Loss Fragments (喪失) - 必須
// ========================================

export const LOSS_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "loss-001",
    category: "loss",
    text: "かつての仲間を見殺しにした",
    description: "助けられたかもしれない命を見捨てた",
  },
  {
    id: "loss-002",
    category: "loss",
    text: "故郷はもう地図にない",
    description: "帰る場所そのものが消えてしまった",
  },
  {
    id: "loss-003",
    category: "loss",
    text: "愛した人を自らの手で葬った",
    description: "最も大切な人の最期を自分の手で",
  },
  {
    id: "loss-004",
    category: "loss",
    text: "名前を奪われた（本名を知らない）",
    description: "自分が何者かの手がかりすらない",
  },
  {
    id: "loss-005",
    category: "loss",
    text: "神の声が聞こえなくなった",
    description: "かつてあった導きが途絶えた",
  },
  {
    id: "loss-006",
    category: "loss",
    text: "右腕の感覚がない",
    description: "腕はあるが、何も感じない",
  },
  {
    id: "loss-007",
    category: "loss",
    text: "笑い方を忘れた",
    description: "喜びの表現ができなくなった",
  },
  {
    id: "loss-008",
    category: "loss",
    text: "帰る場所を燃やしてきた",
    description: "自らの意志で後戻りできなくした",
  },
  {
    id: "loss-009",
    category: "loss",
    text: "信じていた主君に裏切られた",
    description: "忠誠を捧げた相手に捨てられた",
  },
  {
    id: "loss-010",
    category: "loss",
    text: "大切な誰かの顔を思い出せない",
    description: "記憶の中の大事な人が霞んでいく",
  },
] as const;

// ========================================
// Mark Fragments (刻印) - 必須
// ========================================

export const MARK_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "mark-001",
    category: "mark",
    text: "左目が濁った灰色",
    description: "曇った瞳は何も映さない",
  },
  {
    id: "mark-002",
    category: "mark",
    text: "首筋に縄の痕",
    description: "絞首台から逃れた証",
  },
  {
    id: "mark-003",
    category: "mark",
    text: "背中一面の鞭傷",
    description: "幾度も打たれた過去を物語る",
  },
  {
    id: "mark-004",
    category: "mark",
    text: "白髪（若くして）",
    description: "何かを見た、或いは経験した代償",
  },
  {
    id: "mark-005",
    category: "mark",
    text: "片耳が欠けている",
    description: "何かに噛み千切られた、或いは切り落とされた",
  },
  {
    id: "mark-006",
    category: "mark",
    text: "焼け焦げた指先",
    description: "火に触れた記憶を指が覚えている",
  },
  {
    id: "mark-007",
    category: "mark",
    text: "瞳孔が縦に裂けている",
    description: "人ならざる者の眼",
  },
  {
    id: "mark-008",
    category: "mark",
    text: "声が枯れて囁くようにしか出ない",
    description: "叫びすぎた喉、或いは呪い",
  },
  {
    id: "mark-009",
    category: "mark",
    text: "異様に長い影を引きずる",
    description: "影だけが別の存在のよう",
  },
  {
    id: "mark-010",
    category: "mark",
    text: "血の匂いを纏っている（本人は気づかない）",
    description: "洗っても落ちない鉄錆の臭い",
  },
] as const;

// ========================================
// Sin Fragments (業) - 任意
// ========================================

export const SIN_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "sin-001",
    category: "sin",
    text: "殺した数だけ夜に夢を見る",
    description: "眠るたびに死者と向き合う",
  },
  {
    id: "sin-002",
    category: "sin",
    text: "嘘をつくと体が痛む呪い",
    description: "真実しか語れない身体",
  },
  {
    id: "sin-003",
    category: "sin",
    text: "月夜に正気を失う",
    description: "満月の夜、自分が何をするか分からない",
  },
  {
    id: "sin-004",
    category: "sin",
    text: "死者の声が聞こえる",
    description: "静寂の中で囁きが止まない",
  },
  {
    id: "sin-005",
    category: "sin",
    text: "触れたものを腐らせてしまう時がある",
    description: "愛情すら毒に変える",
  },
  {
    id: "sin-006",
    category: "sin",
    text: "誰かに命を狙われている",
    description: "追手の影が常につきまとう",
  },
  {
    id: "sin-007",
    category: "sin",
    text: "人を信じると裏切られる運命",
    description: "信頼は必ず絶望に変わる",
  },
  {
    id: "sin-008",
    category: "sin",
    text: "自分の死の日を知っている",
    description: "終わりの時が刻一刻と近づく",
  },
  {
    id: "sin-009",
    category: "sin",
    text: "「還りなさい」という声が頭から消えない",
    description: "何処かへ帰れと囁く声",
  },
  {
    id: "sin-010",
    category: "sin",
    text: "生きている実感がない",
    description: "自分が本当に存在するのか分からない",
  },
] as const;

// ========================================
// Quest Fragments (探求) - 任意
// ========================================

export const QUEST_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "quest-001",
    category: "quest",
    text: "奪われた妹を探している",
    description: "何処かで生きていると信じている",
  },
  {
    id: "quest-002",
    category: "quest",
    text: "自分が何者か知りたい",
    description: "出自の謎を追い求める",
  },
  {
    id: "quest-003",
    category: "quest",
    text: "ある人物を殺すために生きている",
    description: "復讐だけが生きる理由",
  },
  {
    id: "quest-004",
    category: "quest",
    text: "呪いを解く方法を求めている",
    description: "この身を蝕むものを断ち切りたい",
  },
  {
    id: "quest-005",
    category: "quest",
    text: "罪を贖える死に場所を探している",
    description: "正しく死ぬことで報いたい",
  },
  {
    id: "quest-006",
    category: "quest",
    text: "禁忌の知識を追い求めている",
    description: "知ってはならないものを知りたい",
  },
  {
    id: "quest-007",
    category: "quest",
    text: "かつて交わした約束を果たしに",
    description: "誓いを果たすまで止まれない",
  },
  {
    id: "quest-008",
    category: "quest",
    text: "「帰れ」と言った師匠の真意を知りたい",
    description: "あの言葉の意味を理解するために",
  },
  {
    id: "quest-009",
    category: "quest",
    text: "世界の果てにあるという故郷を目指している",
    description: "存在するかも分からない場所へ",
  },
  {
    id: "quest-010",
    category: "quest",
    text: "人間に戻る方法を探している",
    description: "失った人間性を取り戻したい",
  },
] as const;

// ========================================
// Trait Fragments (癖/性向) - 任意
// ========================================

export const TRAIT_FRAGMENTS: readonly FragmentOption[] = [
  {
    id: "trait-001",
    category: "trait",
    text: "危険なほど他人を信じやすい",
    description: "騙されても人を疑えない",
  },
  {
    id: "trait-002",
    category: "trait",
    text: "朝日を見ると涙が出る",
    description: "理由は分からない、ただ涙が溢れる",
  },
  {
    id: "trait-003",
    category: "trait",
    text: "寝ている人を起こせない",
    description: "誰かの眠りを妨げられない",
  },
  {
    id: "trait-004",
    category: "trait",
    text: "嘘を見抜くが、それを言わない",
    description: "嘘に気づいても黙っている",
  },
  {
    id: "trait-005",
    category: "trait",
    text: "戦闘中だけ饒舌になる",
    description: "刃を交える時、言葉が止まらない",
  },
  {
    id: "trait-006",
    category: "trait",
    text: "子供を見ると目を逸らす",
    description: "幼き者を直視できない理由がある",
  },
  {
    id: "trait-007",
    category: "trait",
    text: "酒を飲まないと眠れない",
    description: "素面では夜を越せない",
  },
  {
    id: "trait-008",
    category: "trait",
    text: "約束を絶対に破れない",
    description: "一度交わした約束は命より重い",
  },
  {
    id: "trait-009",
    category: "trait",
    text: "傷ついた者を放っておけない",
    description: "見て見ぬふりができない性分",
  },
  {
    id: "trait-010",
    category: "trait",
    text: "必ず逃げ道を確認する",
    description: "常に退路を意識している",
  },
] as const;

// ========================================
// All Fragments by Category
// ========================================

export const FRAGMENT_OPTIONS = {
  origin: ORIGIN_FRAGMENTS,
  loss: LOSS_FRAGMENTS,
  mark: MARK_FRAGMENTS,
  sin: SIN_FRAGMENTS,
  quest: QUEST_FRAGMENTS,
  trait: TRAIT_FRAGMENTS,
} as const;

// ========================================
// Utility Functions
// ========================================

/**
 * カテゴリから断片候補を取得
 */
export function getFragmentsByCategory(
  category: FragmentCategory,
): readonly FragmentOption[] {
  return FRAGMENT_OPTIONS[category];
}

/**
 * IDから断片候補を取得
 */
export function getFragmentById(id: string): FragmentOption | undefined {
  for (const fragments of Object.values(FRAGMENT_OPTIONS)) {
    const found = fragments.find((f) => f.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * ランダムに断片を選択
 * @param category カテゴリ
 * @param count 取得する数
 */
export function getRandomFragments(
  category: FragmentCategory,
  count: number,
): FragmentOption[] {
  const fragments = [...FRAGMENT_OPTIONS[category]];
  const result: FragmentOption[] = [];

  for (let i = 0; i < count && fragments.length > 0; i++) {
    const index = Math.floor(Math.random() * fragments.length);
    result.push(fragments[index]);
    fragments.splice(index, 1);
  }

  return result;
}

/**
 * 必須カテゴリかどうか
 */
export function isRequiredCategory(category: FragmentCategory): boolean {
  return category === "origin" || category === "loss" || category === "mark";
}

/**
 * カテゴリの日本語ラベル
 */
export const FRAGMENT_CATEGORY_LABELS: Record<FragmentCategory, string> = {
  origin: "出自",
  loss: "喪失",
  mark: "刻印",
  sin: "業",
  quest: "探求",
  trait: "癖/性向",
} as const;
