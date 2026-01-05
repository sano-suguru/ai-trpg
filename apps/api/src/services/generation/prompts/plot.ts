/**
 * プロット生成プロンプトテンプレート
 *
 * セッションのプロット骨子を生成するためのプロンプト
 */

import { Result, ok, err } from "neverthrow";
import type {
  Character,
  Dungeon,
  DungeonLayer,
  TriggeredEvent,
} from "@ai-trpg/shared/domain";
import { Errors, ValidationError } from "@ai-trpg/shared/types";

/**
 * プロット生成入力
 */
export interface PlotGenerationInput {
  /** パーティのキャラクター情報 */
  readonly party: readonly Character[];
  /** ダンジョン情報 */
  readonly dungeon: Dungeon;
  /** 発火した共鳴イベント */
  readonly triggeredEvents: readonly TriggeredEvent[];
}

/**
 * プロット生成のシステムプロンプト
 */
export const PLOT_SYSTEM_PROMPT = `あなたはダークファンタジーTRPGのゲームマスターです。
与えられたパーティとダンジョンの情報から、セッションのプロット骨子を設計してください。

## 世界観
「灰暦の世界」- 神々は去り、英雄は朽ち、それでも人は歩き続ける黄昏の時代。

## 出力形式
必ず以下のJSON形式で出力してください。マークダウンやコメントは不要です。

{
  "opening": {
    "scene": "ダンジョン入口での状況描写",
    "partyDynamic": "キャラ同士の初期関係性を示す会話のヒント",
    "hook": "なぜ今ここに来たのかの動機"
  },
  "scenes": [
    {
      "number": 1,
      "title": "シーンタイトル",
      "summary": "シーンの概要",
      "characterFocus": "スポットを当てるキャラ名またはnull",
      "triggeredResonance": "発火する共鳴イベントまたはnull"
    }
  ],
  "climax": {
    "confrontation": "核心での対峙内容",
    "choiceBearer": "選択を迫られるキャラ名",
    "resonancePayoff": "共鳴イベントの回収またはnull"
  },
  "resolution": {
    "outcome": "どの結末を迎えたか",
    "cost": "何を得て、何を失ったか",
    "changed": "誰がどう変わったか"
  }
}`;

/**
 * プロット生成プロンプトを構築
 */
export function buildPlotPrompt(input: PlotGenerationInput): string {
  const { party, dungeon, triggeredEvents } = input;

  const partyInfo = party
    .map((char) => {
      const fragments = [
        `  出自: ${char.fragments.origin.text}`,
        `  喪失: ${char.fragments.loss.text}`,
        `  刻印: ${char.fragments.mark.text}`,
        char.fragments.sin ? `  業: ${char.fragments.sin.text}` : null,
        char.fragments.quest ? `  探求: ${char.fragments.quest.text}` : null,
        char.fragments.trait ? `  癖/性向: ${char.fragments.trait.text}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const directives = [
        `  危険時: ${char.directives.danger}`,
        `  仲間の窮地: ${char.directives.allyInPeril}`,
        `  道徳的選択: ${char.directives.moralChoice}`,
        `  未知との遭遇: ${char.directives.unknown}`,
      ].join("\n");

      return `【${char.name}】（${char.title}）
${fragments}
行動指針:
${directives}
貸出設定: ${char.lending}`;
    })
    .join("\n\n");

  const layersInfo = dungeon.layers
    .map(
      (layer: DungeonLayer, i: number) => `第${i + 1}層「${layer.name}」
  雰囲気: ${layer.atmosphere}
  候補イベント: ${layer.possibleEvents.join("、")}`,
    )
    .join("\n\n");

  const coreInfo = `性質: ${dungeon.core.nature}
説明: ${dungeon.core.description}
可能な結末:
${dungeon.core.possibleOutcomes.map((o: string) => `  - ${o}`).join("\n")}`;

  const triggeredInfo =
    triggeredEvents.length > 0
      ? triggeredEvents
          .map(
            (e) => `- ${e.characterName}（${e.fragmentCategory}）: ${e.effect}`,
          )
          .join("\n")
      : "（なし）";

  return `## パーティ

${partyInfo}

## ダンジョン

【${dungeon.name}】 ─ ${dungeon.alias}
難易度: ${dungeon.difficultyTone}
試練タイプ: ${dungeon.trialTypes.join("、")}

### ロア
過去: ${dungeon.lore.past}
転落: ${dungeon.lore.fall}
現在: ${dungeon.lore.now}

### 層構造
${layersInfo}

### 核心
${coreInfo}

## 発火した共鳴イベント
${triggeredInfo}

## 制約
- 全員に最低1回はスポットライトを当てる
- 共鳴イベントは必ず物語に組み込む
- キャラの行動指針に反する行動をさせない
- 結末は possible_outcomes のいずれかをベースにする
- 「lending: safe」のキャラは死亡・永続損傷させない
- シーン数は5〜8程度

上記の情報から、セッションのプロット骨子をJSON形式で出力してください。`;
}

/**
 * パース結果の型
 */
export interface PlotStructure {
  opening: {
    scene: string;
    partyDynamic: string;
    hook: string;
  };
  scenes: Array<{
    number: number;
    title: string;
    summary: string;
    characterFocus: string | null;
    triggeredResonance: string | null;
  }>;
  climax: {
    confrontation: string;
    choiceBearer: string;
    resonancePayoff: string | null;
  };
  resolution: {
    outcome: string;
    cost: string;
    changed: string;
  };
}

/**
 * プロット応答を解析
 *
 * @returns パース結果またはバリデーションエラー
 */
export function parsePlotResponse(
  response: string,
): Result<PlotStructure, ValidationError> {
  // JSONブロックを抽出（コードブロックで囲まれている場合に対応）
  let jsonStr = response.trim();

  // ```json ... ``` または ``` ... ``` を除去
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr) as PlotStructure;
    return ok(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なJSONパースエラー";
    return err(
      Errors.validation(
        `プロットJSONのパースに失敗しました: ${message}`,
        "plot",
      ),
    );
  }
}
