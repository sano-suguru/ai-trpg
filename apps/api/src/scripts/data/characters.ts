/**
 * サンプルキャラクターデータ
 *
 * docs/design.md の世界観に基づいた、デモ用のキャラクターデータ
 */

import type { NewCharacterRow } from "../../infrastructure/database/schema/characters";
import { SEED_OWNER_ID, SEED_CHARACTERS } from "@ai-trpg/shared/fixtures";

// re-export for backward compatibility with seed.ts
export { SEED_OWNER_ID };

export const sampleCharacters: NewCharacterRow[] = [
  // 灰村のセド（docs/design.md より）
  {
    id: SEED_CHARACTERS.sed.id,
    ownerId: SEED_OWNER_ID,
    name: SEED_CHARACTERS.sed.name,
    title: SEED_CHARACTERS.sed.title,
    biography: `灰燼の街が焼け落ちた夜、彼は最愛の人を自らの手で殺さねばならなかった。
——そうしなければ、もっと多くが死んだ。
そう言い聞かせても、夜ごとの夢が許さない。
焦げた指先は、あの夜から治らない。
今は贖罪の果て、死に場所を探して歩いている。`,
    fragments: {
      origin: { category: "origin", text: "灰燼の街の生き残り" },
      loss: { category: "loss", text: "愛した人を自らの手で葬った" },
      mark: { category: "mark", text: "焼け焦げた指先" },
      sin: { category: "sin", text: "殺した数だけ夜に夢を見る" },
      quest: { category: "quest", text: "罪を贖える死に場所を探している" },
      trait: null,
    },
    directives: {
      danger: "仲間を下がらせ、殿を務める",
      ally_in_peril: "何を犠牲にしても助ける",
      moral_choice: "弱い者の側に立つ",
      unknown: "警戒し、距離を取る",
    },
    voiceSamples: [
      { situation: "同意するとき", sample: "……ああ" },
      { situation: "拒否するとき", sample: "それは、できない" },
      { situation: "感情が昂ったとき", sample: "黙れ……っ！" },
    ],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "safe",
    isPublic: true,
  },

  // リラ（喪われた声の魔女）
  {
    id: SEED_CHARACTERS.lila.id,
    ownerId: SEED_OWNER_ID,
    name: SEED_CHARACTERS.lila.name,
    title: SEED_CHARACTERS.lila.title,
    biography: `かつて彼女の声は人を癒した。
異端審問の夜、喉を焼かれてからは囁くことしかできない。
それでも声なき歌を紡ぎ、傷ついた者を導き続ける。
失ったものを取り戻すことはできない。
だが、まだ救えるものはある——そう信じて。`,
    fragments: {
      origin: { category: "origin", text: "神殿に捨てられていた子" },
      loss: { category: "loss", text: "声を奪われた" },
      mark: { category: "mark", text: "首筋に縄の痕" },
      sin: null,
      quest: {
        category: "quest",
        text: "失われた癒しの歌を取り戻す方法を探している",
      },
      trait: { category: "trait", text: "傷ついた者を放っておけない" },
    },
    directives: {
      danger: "慎重に状況を見極める",
      ally_in_peril: "助けたいが、無謀はしない",
      moral_choice: "弱い者の側に立つ",
      unknown: "知識で対処しようとする",
    },
    voiceSamples: [
      { situation: "同意するとき", sample: "（小さく頷く）" },
      { situation: "拒否するとき", sample: "……いけない……" },
      { situation: "警告するとき", sample: "気をつけ……て……" },
    ],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "safe",
    isPublic: true,
  },

  // 灰色のヴォルク
  {
    id: SEED_CHARACTERS.volk.id,
    ownerId: SEED_OWNER_ID,
    name: SEED_CHARACTERS.volk.name,
    title: SEED_CHARACTERS.volk.title,
    biography: `彼が所属していた傭兵団はもういない。
最後の戦いで仲間を見殺しにした——生き延びるために。
今は一人で依頼を受け、金のためだけに剣を振るう。
誰も信じない、何も期待しない。
それが、また誰かを失わないための唯一の方法だから。`,
    fragments: {
      origin: { category: "origin", text: "傭兵団で育った孤児" },
      loss: { category: "loss", text: "かつての仲間を見殺しにした" },
      mark: { category: "mark", text: "白髪（若くして）" },
      sin: { category: "sin", text: "人を信じると裏切られる運命" },
      quest: null,
      trait: { category: "trait", text: "必ず逃げ道を確認する" },
    },
    directives: {
      danger: "逃げ道を探す",
      ally_in_peril: "冷静に最善手を探す",
      moral_choice: "現実的な利を取る",
      unknown: "警戒し、距離を取る",
    },
    voiceSamples: [
      { situation: "同意するとき", sample: "報酬次第だ" },
      { situation: "拒否するとき", sample: "死にたきゃ勝手にしろ" },
      {
        situation: "珍しく感情を見せるとき",
        sample: "……昔、似たような奴がいた",
      },
    ],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "all",
    isPublic: true,
  },

  // 朽ちゆく月のエレナ
  {
    id: SEED_CHARACTERS.elena.id,
    ownerId: SEED_OWNER_ID,
    name: SEED_CHARACTERS.elena.name,
    title: SEED_CHARACTERS.elena.title,
    biography: `かつての王家に仕えた騎士の家系。
王国が崩壊した今、家名は汚名となった。
それでも剣を捨てられないのは、誓いを守るため——
もはや守るべき主君はいないとしても。
朽ちゆく誇りを抱えたまま、彼女は荒野を行く。`,
    fragments: {
      origin: { category: "origin", text: "没落貴族の末裔" },
      loss: { category: "loss", text: "信じていた主君に裏切られた" },
      mark: { category: "mark", text: "左目が濁った灰色" },
      sin: null,
      quest: { category: "quest", text: "かつて交わした約束を果たしに" },
      trait: { category: "trait", text: "約束を絶対に破れない" },
    },
    directives: {
      danger: "迷わず前に出る",
      ally_in_peril: "何を犠牲にしても助ける",
      moral_choice: "正しいと信じる道を選ぶ",
      unknown: "好奇心が恐怖に勝つ",
    },
    voiceSamples: [
      { situation: "同意するとき", sample: "承知した" },
      { situation: "拒否するとき", sample: "騎士として、それは許容できぬ" },
      { situation: "決意するとき", sample: "我が剣に誓って" },
    ],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "safe",
    isPublic: true,
  },

  // 名なしの呪い師
  {
    id: SEED_CHARACTERS.nameless.id,
    ownerId: SEED_OWNER_ID,
    name: SEED_CHARACTERS.nameless.name,
    title: SEED_CHARACTERS.nameless.title,
    biography: `本名を知らない。
記憶にあるのは、目覚めたとき周りにあった死体の山だけ。
触れたものを腐らせてしまうことがある——
それが呪いなのか、本来の力なのかもわからない。
自分が何者かを知るために、世界の果てを目指している。`,
    fragments: {
      origin: { category: "origin", text: "死体の山から目覚めた（記憶なし）" },
      loss: { category: "loss", text: "名前を奪われた（本名を知らない）" },
      mark: { category: "mark", text: "瞳孔が縦に裂けている" },
      sin: { category: "sin", text: "触れたものを腐らせてしまう時がある" },
      quest: { category: "quest", text: "自分が何者か知りたい" },
      trait: null,
    },
    directives: {
      danger: "慎重に状況を見極める",
      ally_in_peril: "助けたいが、無謀はしない",
      moral_choice: "選ばない（両方壊す/逃げる）",
      unknown: "とりあえず触ってみる",
    },
    voiceSamples: [
      {
        situation: "自己紹介するとき",
        sample: "名前はない。呼びたければ好きに呼べ",
      },
      { situation: "警告するとき", sample: "触るな。腐る" },
      { situation: "困惑するとき", sample: "……これは、何だ？" },
    ],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "all",
    isPublic: true,
  },
];
