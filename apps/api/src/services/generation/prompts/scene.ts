/**
 * シーン生成プロンプトテンプレート
 *
 * プロット骨子を元に個別シーンのテキストを生成するためのプロンプト
 */

import type { GeneratedPlot } from "../plot";

/**
 * シーン生成入力
 */
export interface SceneGenerationInput {
  /** シーン番号（1始まり） */
  readonly sceneNumber: number;
  /** シーンタイトル */
  readonly sceneTitle: string;
  /** シーン概要（プロットから） */
  readonly sceneSummary: string;
  /** スポットライトキャラクター */
  readonly characterFocus: string | null;
  /** 発火する共鳴イベント */
  readonly triggeredResonance: string | null;
  /** ダンジョン名 */
  readonly dungeonName: string;
  /** ダンジョン別名 */
  readonly dungeonAlias: string;
  /** プロット全体（文脈として） */
  readonly plot: GeneratedPlot;
  /** 前シーンのテキスト（文脈として） */
  readonly previousSceneText: string | null;
  /** 最終シーンかどうか */
  readonly isLastScene: boolean;
}

/**
 * シーン生成のシステムプロンプト
 */
export const SCENE_SYSTEM_PROMPT = `あなたはダークファンタジーTRPGのリプレイ作家です。
TRPGリプレイ形式でシーンを執筆してください。

## 世界観
「灰暦の世界」- 神々は去り、英雄は朽ち、それでも人は歩き続ける黄昏の時代。

## 文体
- TRPGリプレイ形式（地の文とセリフの混在）
- セリフは「」で囲む
- キャラクターの内面描写を入れる
- 情景描写は簡潔に、雰囲気を重視

## 制約
- 400〜600文字程度
- シーンタイトルは出力しない（本文のみ）
- マークダウン記法は使わない
- 「〜した」「〜だった」の過去形で統一`;

/**
 * シーン生成プロンプトを構築
 */
export function buildScenePrompt(input: SceneGenerationInput): string {
  const {
    sceneNumber,
    sceneTitle,
    sceneSummary,
    characterFocus,
    triggeredResonance,
    dungeonName,
    dungeonAlias,
    plot,
    previousSceneText,
    isLastScene,
  } = input;

  const parts: string[] = [];

  // 文脈情報
  parts.push(`## ダンジョン\n「${dungeonName}」─${dungeonAlias}`);

  // プロット概要
  parts.push(`## プロット概要
オープニング: ${plot.opening.hook}
クライマックス: ${plot.climax.confrontation}
結末: ${plot.resolution.outcome}`);

  // 前シーンの文脈
  if (previousSceneText) {
    parts.push(`## 前シーン
${previousSceneText.slice(-300)}...`);
  }

  // 今回のシーン情報
  parts.push(`## 今回のシーン
シーン${sceneNumber}: 「${sceneTitle}」
概要: ${sceneSummary}`);

  if (characterFocus) {
    parts.push(`スポットライト: ${characterFocus}`);
  }

  if (triggeredResonance) {
    parts.push(`共鳴イベント: ${triggeredResonance}（このシーンで発動）`);
  }

  // 最終シーンの場合は追加指示
  if (isLastScene) {
    parts.push(`
## 注意
これは最終シーンです。結末への布石となる描写を含めてください。
- ${plot.resolution.cost}
- ${plot.resolution.changed}`);
  }

  parts.push(`
上記の情報から、このシーンのリプレイテキストを400〜600文字で執筆してください。`);

  return parts.join("\n\n");
}

/**
 * エピグラフ生成入力
 */
export interface EpigraphGenerationInput {
  /** ダンジョン名 */
  readonly dungeonName: string;
  /** ダンジョン別名 */
  readonly dungeonAlias: string;
  /** ダンジョンロア */
  readonly lore: {
    readonly past: string;
    readonly fall: string;
    readonly now: string;
  };
  /** 結末タイプ */
  readonly outcomeType: string;
}

/**
 * エピグラフ生成のシステムプロンプト
 */
export const EPIGRAPH_SYSTEM_PROMPT = `あなたはダークファンタジー世界の古代語録の編纂者です。
ダンジョンにまつわる短い引用文（エピグラフ）を創作してください。

## 文体
- 詩的・預言的な表現
- 古語風の言い回し
- 意味深長で謎めいた雰囲気

## 制約
- 2〜3行程度（50〜100文字）
- 出典を「──『○○』より」の形式で付ける
- マークダウン記法は使わない`;

/**
 * エピグラフ生成プロンプトを構築
 */
export function buildEpigraphPrompt(input: EpigraphGenerationInput): string {
  return `ダンジョン「${input.dungeonName}」─${input.dungeonAlias}

このダンジョンにまつわるエピグラフを創作してください。

ロア:
- 過去: ${input.lore.past}
- 転落: ${input.lore.fall}
- 現在: ${input.lore.now}

結末の雰囲気: ${input.outcomeType}`;
}

/**
 * エピローグ生成入力
 */
export interface EpilogueGenerationInput {
  /** プロット */
  readonly plot: GeneratedPlot;
  /** ダンジョン名 */
  readonly dungeonName: string;
  /** 全シーンのテキスト */
  readonly allScenesText: string;
}

/**
 * エピローグ生成のシステムプロンプト
 */
export const EPILOGUE_SYSTEM_PROMPT = `あなたはダークファンタジーTRPGのリプレイ作家です。
セッションの締めくくりとなるエピローグを執筆してください。

## 世界観
「灰暦の世界」- 神々は去り、英雄は朽ち、それでも人は歩き続ける黄昏の時代。

## 文体
- リプレイの「あとがき」風
- 余韻を残す終わり方
- キャラクターたちの今後を示唆

## 制約
- 200〜400文字程度
- マークダウン記法は使わない
- 「〜した」「〜だった」の過去形で統一`;

/**
 * エピローグ生成プロンプトを構築
 */
export function buildEpiloguePrompt(input: EpilogueGenerationInput): string {
  const { plot, dungeonName, allScenesText } = input;

  return `## ダンジョン
「${dungeonName}」

## セッション概要
${plot.opening.hook}

${allScenesText.slice(-500)}...

## 結末
${plot.resolution.outcome}
${plot.resolution.cost}
${plot.resolution.changed}

上記のセッションを締めくくるエピローグを200〜400文字で執筆してください。`;
}
