/**
 * サンプルダンジョンデータ
 *
 * docs/design.md の世界観に基づいた、デモ用のダンジョンデータ
 */

import type { NewDungeonRow } from "../../infrastructure/database/schema/dungeons";
import { SEED_OWNER_ID, SEED_DUNGEONS } from "@ai-trpg/shared/fixtures";

export const sampleDungeons: NewDungeonRow[] = [
  // 忘却の聖堂（docs/design.md より）
  {
    id: SEED_DUNGEONS.cathedral.id,
    authorId: SEED_OWNER_ID,
    name: SEED_DUNGEONS.cathedral.name,
    alias: SEED_DUNGEONS.cathedral.alias,
    layerCount: SEED_DUNGEONS.cathedral.layerCount,
    recommendedParty: "2〜4人",
    difficultyTone: "heavy",
    tags: [
      "#朽ちた神聖",
      "#悔恨",
      "#帰れない者たち",
      "#静寂の恐怖",
      "#愛ゆえの罪",
    ],
    trialTypes: ["moral_choice", "inner_confrontation", "negotiation"],
    lore: {
      past: `かつて、この地には癒しの聖者を祀る聖堂があった。
巡礼者が絶えず、奇跡すら起きたという。
病める者は癒され、絶望する者は希望を与えられた。`,
      fall: `ある夜、聖堂の司祭が禁忌を犯した。
死んだ娘を蘇らせようとして——
聖堂は一夜で沈黙し、以来、誰も帰ってこない。`,
      now: `今も夜ごと、聖堂の鐘が鳴るのを聞いたという者がいる。
「帰っておいで」と呼ぶ声とともに。
入った者は二度と帰らない——あるいは、帰りたくないのかもしれない。`,
    },
    layers: [
      {
        name: "外縁 - 沈黙の参道",
        atmosphere:
          "石畳を覆う苔、倒れた巡礼者の荷物が散乱。かつての賑わいを思わせる供物台が点在する。",
        possibleEvents: [
          "過去の巡礼者の幻影が道を示す",
          "供物台に何かを置くと、道が開く",
          "仲間の一人が「懐かしい」と呟く（なぜ？）",
        ],
      },
      {
        name: "礼拝堂 - 祈りの残響",
        atmosphere:
          "壊れたステンドグラス、祭壇に残る黒い染み。かすかに聖歌が聞こえる。",
        possibleEvents: [
          "聖歌が聞こえる。歌っているのは誰？",
          "祭壇の前で、最も『罪』を持つ者が膝をつく",
          "告解室から声がする",
        ],
      },
      {
        name: "地下墓所 - 還らずの底",
        atmosphere:
          "無数の棺が並び、中央に一つだけ開いている。冷たい光が差し込む。",
        possibleEvents: [
          "司祭の亡霊との対峙",
          "『娘』が現れる。敵か、救うべき者か",
          "誰かが『ここに残る』選択を迫られる",
        ],
      },
    ],
    core: {
      nature: "choice",
      description: `司祭の亡霊は問う。
「私は間違っていたのか? 愛する者を取り戻そうとして」

『娘』は泣いている。
死者として在り続けることに疲れ果てて。`,
      possibleOutcomes: [
        "娘を解放する → 司祭は消え、聖堂は静まる",
        "司祭を肯定する → 娘は永遠に囚われ、代わりに何かを得る",
        "両者を拒絶する → 聖堂ごと崩壊、脱出戦",
        "誰かが娘の代わりに残る → 究極の犠牲",
      ],
    },
    resonance: [
      {
        fragmentType: "loss",
        keywords: ["愛した人", "自らの手で", "家族"],
        effect: "『娘』がこのキャラに特に反応する。「あなたも、誰かを……？」",
      },
      {
        fragmentType: "sin",
        keywords: ["夢", "罪", "贖い"],
        effect:
          "司祭の亡霊がこのキャラを「同類」と見なす。特別な対話ルートが開く。",
      },
      {
        fragmentType: "quest",
        keywords: ["死に場所", "贖い", "終わり"],
        effect: "「ここに残る」選択肢がこのキャラに提示される。",
      },
    ],
    isPublic: true,
    playCount: 0,
  },

  // 灰燼の街の廃墟
  {
    id: SEED_DUNGEONS.ashCity.id,
    authorId: SEED_OWNER_ID,
    name: SEED_DUNGEONS.ashCity.name,
    alias: SEED_DUNGEONS.ashCity.alias,
    layerCount: SEED_DUNGEONS.ashCity.layerCount,
    recommendedParty: "2〜4人",
    difficultyTone: "heavy",
    tags: ["#滅びた地", "#火", "#生き残り", "#記憶", "#罪悪感"],
    trialTypes: ["survival", "inner_confrontation", "moral_choice"],
    lore: {
      past: `かつて鍛冶で栄えた街。
炎を操る技術は大陸一と謳われ、武具、装飾品、魔導具——
あらゆるものがこの街の炉から生まれた。`,
      fall: `「灰の夜」と呼ばれる大火で一夜にして滅びた。
火は街の中心から始まり、瞬く間に全てを飲み込んだ。
生き残った者はごくわずか。原因は、今も謎のままだ。`,
      now: `廃墟には今も燃え続ける炉があるという。
夜になると、かつての住人の影が街を彷徨う。
生き残った者が帰ると、街が「歓迎」するらしい。`,
    },
    layers: [
      {
        name: "外縁 - 灰の入口",
        atmosphere:
          "崩れた城門、灰に埋もれた街路。所々に焼け焦げた骨が見える。",
        possibleEvents: [
          "かつての住人の声が聞こえる——生前の日常の会話",
          "焼けた看板が道を示す。行くべきか？",
          "灰の中から何かが這い出てくる",
        ],
      },
      {
        name: "中央広場 - 炎の記憶",
        atmosphere:
          "広場の中央にまだ炎が燃えている。周囲には炭化した死体が円形に並ぶ。",
        possibleEvents: [
          "炎が語りかける——それは意志を持つ何か",
          "死体の一つがこちらを見ている",
          "「あの夜」の記憶が、誰かの頭に流れ込む",
        ],
      },
      {
        name: "鍛冶師の炉 - 灰の底",
        atmosphere:
          "街最大の鍛冶場。炉は今も赤く燃え、何かを鋳造し続けている。",
        possibleEvents: [
          "炉の主——かつての親方の亡霊との対峙",
          "「あの夜」の真実が明かされる",
          "炉を止めるか、引き継ぐかの選択",
        ],
      },
    ],
    core: {
      nature: "discovery",
      description: `炉の親方の亡霊は問う。
「お前は知っているか? あの夜、誰が火を放ったか」

真実は残酷かもしれない。
それでも知りたいか——知らずに済ませたいか。`,
      possibleOutcomes: [
        "真実を受け入れる → 炉は消え、街は完全に灰となる",
        "真実を拒絶する → 炉は燃え続け、何かを得られる",
        "親方の願いを引き継ぐ → 炉を新たな目的に使う",
        "全てを燃やし尽くす → 街ごと完全消滅、代償と引き換えに",
      ],
    },
    resonance: [
      {
        fragmentType: "origin",
        keywords: ["灰燼の街", "生き残り", "火"],
        effect: "「あの夜」の記憶が鮮明に蘇る。NPCが本名で呼びかけてくる。",
      },
      {
        fragmentType: "loss",
        keywords: ["故郷", "燃やした", "帰れない"],
        effect: "炎が特別な形を取る——かつて失ったものの姿に。",
      },
      {
        fragmentType: "mark",
        keywords: ["焼け焦げ", "火傷", "炎"],
        effect: "刻印が反応し、炎の記憶の一部にアクセスできる。",
      },
    ],
    isPublic: true,
    playCount: 0,
  },

  // 渡りの海の沈没船
  {
    id: SEED_DUNGEONS.shipwreck.id,
    authorId: SEED_OWNER_ID,
    name: SEED_DUNGEONS.shipwreck.name,
    alias: SEED_DUNGEONS.shipwreck.alias,
    layerCount: SEED_DUNGEONS.shipwreck.layerCount,
    recommendedParty: "2〜3人",
    difficultyTone: "normal",
    tags: ["#海", "#約束", "#待つ者", "#沈黙", "#交易"],
    trialTypes: ["exploration", "puzzle", "negotiation"],
    lore: {
      past: `渡りの海を行く交易船団の中で、最も大きく美しい船だった。
「約束の帆」と呼ばれ、必ず港に帰ると信じられていた。
船長は家族に必ず帰ると約束し、最後の航海に出た。`,
      fall: `嵐が来たのか、海賊に襲われたのか——
船は港に帰ることなく、渡りの海の底に沈んだ。
今も船長の妻は、灯台から海を見ている。`,
      now: `満月の夜、海面に船の影が浮かぶという。
潜った者の話では、船はまだ動いている——
沈んだまま、どこかを目指して。`,
    },
    layers: [
      {
        name: "甲板 - 永遠の航海",
        atmosphere:
          "海藻に覆われた甲板。水中なのに風が吹き、帆がはためいている。",
        possibleEvents: [
          "船員の亡霊が航海の仕事を続けている",
          "航海日誌が浮かんでいる——最後のページは？",
          "帰港を告げる鐘が鳴る——だが港はない",
        ],
      },
      {
        name: "船長室 - 果たされぬ約束",
        atmosphere:
          "豪華だった船長室。机には書きかけの手紙と、小さな人形が置かれている。",
        possibleEvents: [
          "船長の亡霊との対話",
          "手紙を届けるか、ここに残すかの選択",
          "船を港に導く方法の発見",
        ],
      },
    ],
    core: {
      nature: "choice",
      description: `船長の亡霊は疲れ果てている。
「帰りたい。だが、この船は港を見つけられない」

手紙には、愛する者への最後の言葉が。
約束を果たすか、眠らせるか——選ばねばならない。`,
      possibleOutcomes: [
        "手紙を届ける約束をする → 船は沈み、亡霊は安らぐ",
        "船を港に導く → 難しい航海だが、奇跡が起きるかも",
        "船長を説得して諦めさせる → 船は永遠にここに留まる",
      ],
    },
    resonance: [
      {
        fragmentType: "quest",
        keywords: ["約束", "果たす", "帰る"],
        effect: "船長がこのキャラを「理解者」と見なす。手紙を託される。",
      },
      {
        fragmentType: "loss",
        keywords: ["待つ", "家族", "帰れない"],
        effect: "船員の亡霊たちがこのキャラに特に反応する。",
      },
    ],
    isPublic: true,
    playCount: 0,
  },
];
