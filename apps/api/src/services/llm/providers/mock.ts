/**
 * モックLLMプロバイダー
 *
 * E2Eテスト用の固定レスポンスを返すプロバイダー
 * 環境変数 USE_MOCK_LLM=true で有効化
 */

import { okAsync } from "neverthrow";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../types";

// ========================================
// Constants
// ========================================

const PROVIDER_NAME = "mock" as const;

/**
 * モックレスポンス
 *
 * 実際のLLMが生成するような自然な文章を固定で返す
 */
const MOCK_RESPONSES = {
  biography: `灰の時代に生まれ、かつて栄華を誇った故郷が一夜にして炎に包まれるのを目撃した。
逃げ惑う人々の中で、愛する者を救えなかった記憶が今も胸を焼く。
白髪はあの夜に変わり、焦げた指先は決して癒えない傷として残る。
それでも前を向き、同じ悲劇を繰り返させまいと旅を続けている。`,

  names: `1. 灰燼のセド
2. 忘却のリラ
3. 灰色のヴォルク`,

  plot: JSON.stringify({
    opening: {
      scene:
        "廃墟と化した街の入り口に立つ。かつての華やかさの残滓が、朽ちた柱や割れた窓から垣間見える。灰色の空からは細かな灰が舞い落ちている。",
      partyDynamic:
        "一行は互いに警戒しつつも、この地に呼ばれた理由を探ろうとしている。",
      hook: "街の奥から、かすかに子供の泣き声が聞こえてくる。",
    },
    scenes: [
      {
        number: 1,
        title: "崩れた市場",
        summary:
          "かつて賑わった市場は今や瓦礫の山。その中で、一行は最初の手がかりを見つける。",
        characterFocus: null,
        triggeredResonance: null,
      },
      {
        number: 2,
        title: "記憶の断片",
        summary: "壁に残された落書きが、この街の最期の日を物語っている。",
        characterFocus: "セド",
        triggeredResonance: "滅びた地の記憶",
      },
      {
        number: 3,
        title: "地下への道",
        summary: "崩れかけた建物の地下に、人が通った形跡がある。",
        characterFocus: null,
        triggeredResonance: null,
      },
      {
        number: 4,
        title: "生存者の隠れ家",
        summary: "地下で生き延びていた者たちとの遭遇。彼らは何かを隠している。",
        characterFocus: "リラ",
        triggeredResonance: null,
      },
      {
        number: 5,
        title: "真実の重み",
        summary:
          "この街を滅ぼした火の正体が明らかになる。それは偶然ではなかった。",
        characterFocus: null,
        triggeredResonance: "火の記憶",
      },
    ],
    climax: {
      confrontation:
        "街を滅ぼした元凶と対峙する。それは人の形をした何かだった。",
      choiceBearer: "セド",
      resonancePayoff: "かつて失った者たちの記憶が力となり、最後の選択を導く。",
    },
    resolution: {
      outcome:
        "街は滅んだままだが、真実は明らかになった。生存者たちは新たな地を目指す。",
      cost: "過去と向き合う痛みを受け入れた。",
      changed: "セドは過去の呪縛から解放され、リラは新たな目的を見出した。",
    },
  }),

  epigraph:
    "灰の中に埋もれた真実は、掘り起こす者を待っている。だがその手は、灰に染まることを覚悟せねばならない。",

  scene: `廃墟の街に足を踏み入れた時、最初に感じたのは静寂だった。かつて人々の声で溢れていたであろう通りは、今や風の音だけが支配している。足元には割れた陶器の破片、壁には焦げた跡。全てがあの日のままに時を止めていた。

風が吹くたび、灰が舞い上がる。その一粒一粒が、かつてここで生きていた者たちの記憶のようだった。

「ここだったのか」

セドが呟いた。その声には、どこか遠い記憶を辿るような響きがあった。焼け焦げた指先が、崩れかけた壁に触れる。冷たい石の感触が、あの夜の熱を思い出させた。

「何か感じる？」リラが静かに問いかける。

「いや……ただの、残響だ」

二人は瓦礫の間を進んでいく。この街が滅びた理由を知る者は、もうどこにもいない。だが、その答えは——きっと、この先にある。`,

  epilogue:
    "一行は街を後にした。背後には、ようやく安らぎを得た亡霊たちの気配。前方には、まだ見ぬ道が広がっている。灰は風に舞い、やがて新たな大地へと運ばれていく。終わりは始まりでもある——それを知った者だけが、前に進むことができるのだ。",
} as const;

// ========================================
// Provider Implementation
// ========================================

/**
 * モックプロバイダーを作成
 *
 * E2Eテストで使用する固定レスポンスを返すプロバイダー
 * - 即座にレスポンスを返す（ネットワーク遅延なし）
 * - 常に成功する（エラーシミュレーションなし）
 */
export function createMockProvider(): LLMProvider {
  const isAvailable = (): boolean => {
    // モックは常に利用可能
    return true;
  };

  const generate = (
    prompt: string,
    options?: GenerateOptions,
  ): ReturnType<LLMProvider["generate"]> => {
    const systemPrompt = options?.systemPrompt ?? "";

    // システムプロンプトまたはプロンプトの内容で生成タイプを判定
    let text: string;

    if (systemPrompt.includes("プロット") || prompt.includes("プロット生成")) {
      // プロット生成
      text = MOCK_RESPONSES.plot;
    } else if (
      systemPrompt.includes("エピグラフ") ||
      prompt.includes("エピグラフ")
    ) {
      // エピグラフ生成
      text = MOCK_RESPONSES.epigraph;
    } else if (
      systemPrompt.includes("エピローグ") ||
      prompt.includes("エピローグ")
    ) {
      // エピローグ生成
      text = MOCK_RESPONSES.epilogue;
    } else if (systemPrompt.includes("シーン") || prompt.includes("シーン")) {
      // シーン生成
      text = MOCK_RESPONSES.scene;
    } else if (systemPrompt.includes("人物像")) {
      // 経歴生成
      text = MOCK_RESPONSES.biography;
    } else {
      // デフォルト：名前生成
      text = MOCK_RESPONSES.names;
    }

    const result: GenerateResult = {
      text,
      provider: PROVIDER_NAME,
      tokens: {
        prompt: 100,
        completion: 50,
        total: 150,
      },
    };

    return okAsync(result);
  };

  return {
    name: PROVIDER_NAME,
    generate,
    isAvailable,
  };
}
