/**
 * セッション生成パイプライン
 *
 * セッション生成の全フローを統合し、進捗イベントを通知する
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type { LLMServiceError } from "../llm/types";
import type { LLMProvider } from "../llm/types";
import type {
  Character,
  Dungeon,
  TriggeredEvent,
} from "@ai-trpg/shared/domain";
import type { SessionId, ReplayId } from "@ai-trpg/shared/domain";
import type {
  Replay,
  ReplayHeader,
  ReplayFooter,
  Scene,
  PartyMemberInfo,
  CharacterChange,
  OutcomeType,
  ChangeType,
} from "@ai-trpg/shared/domain";
import {
  OutcomeTypes,
  ChangeTypes,
  createReplay,
} from "@ai-trpg/shared/domain";
import { createLogger } from "../logger";
import { scanResonance, type CharacterForResonance } from "./resonance";
import { generatePlot, type GeneratedPlot } from "./plot";
import {
  generateAllScenes,
  generateEpigraph,
  generateEpilogue,
  type GeneratedScene,
} from "./scene";
import type {
  EpigraphGenerationInput,
  EpilogueGenerationInput,
} from "./prompts/scene";

// ========================================
// Types
// ========================================

/**
 * パイプライン入力
 */
export interface PipelineInput {
  readonly sessionId: SessionId;
  readonly party: readonly Character[];
  readonly dungeon: Dungeon;
}

/**
 * パイプライン設定
 */
export interface PipelineConfig {
  /** LLMプロバイダー（フォールバック戦略で選択済み） */
  readonly llmProvider: LLMProvider;
}

/**
 * 生成進捗イベント
 */
export type GenerationEvent =
  | { readonly type: "started" }
  | { readonly type: "resonance_complete"; readonly eventCount: number }
  | { readonly type: "plot_complete"; readonly sceneCount: number }
  | {
      readonly type: "scene_generating";
      readonly current: number;
      readonly total: number;
    }
  | {
      readonly type: "scene_complete";
      readonly current: number;
      readonly total: number;
    }
  | {
      readonly type: "completed";
      readonly replayId: ReplayId;
      readonly totalCharCount: number;
    }
  | { readonly type: "failed"; readonly error: string };

/**
 * 進捗コールバック
 */
export type ProgressCallback = (event: GenerationEvent) => void;

/**
 * パイプライン結果
 */
export interface PipelineResult {
  readonly replay: Replay;
  readonly triggeredEvents: readonly TriggeredEvent[];
  readonly plot: GeneratedPlot;
}

// ========================================
// Constants
// ========================================

const logger = createLogger("GenerationPipeline");

// ========================================
// Pipeline
// ========================================

/**
 * セッション生成パイプラインを実行
 */
export function runGenerationPipeline(
  input: PipelineInput,
  config: PipelineConfig,
  replayId: ReplayId,
  onProgress?: ProgressCallback,
): ResultAsync<PipelineResult, LLMServiceError> {
  const { sessionId, party, dungeon } = input;
  const { llmProvider } = config;

  logger.info("Starting generation pipeline", {
    sessionId,
    partySize: party.length,
    dungeonName: dungeon.name,
  });

  // 進捗通知ヘルパー
  const notify = (event: GenerationEvent): void => {
    if (onProgress) {
      onProgress(event);
    }
  };

  notify({ type: "started" });

  // Step 1: 共鳴スキャン
  const charactersForResonance: CharacterForResonance[] = party.map((char) => ({
    id: char.id,
    name: char.name as string,
    fragments: char.fragments,
  }));

  const resonanceResult = scanResonance(
    charactersForResonance,
    dungeon.resonance,
  );

  logger.info("Resonance scan completed", {
    triggeredCount: resonanceResult.triggeredEvents.length,
  });

  notify({
    type: "resonance_complete",
    eventCount: resonanceResult.triggeredEvents.length,
  });

  // Step 2: プロット生成
  return generatePlot(llmProvider, {
    party,
    dungeon,
    triggeredEvents: resonanceResult.triggeredEvents,
  })
    .andThen((plot) => {
      logger.info("Plot generation completed", {
        sceneCount: plot.scenes.length,
      });

      notify({
        type: "plot_complete",
        sceneCount: plot.scenes.length,
      });

      // Step 3: エピグラフ生成
      const epigraphInput: EpigraphGenerationInput = {
        dungeonName: dungeon.name as string,
        dungeonAlias: dungeon.alias as string,
        lore: dungeon.lore,
        outcomeType: plot.resolution.outcome,
      };

      return generateEpigraph(llmProvider, epigraphInput).andThen(
        (epigraph) => {
          logger.debug("Epigraph generated", { length: epigraph.length });

          // Step 4: シーン生成（順次）
          return generateAllScenes(
            llmProvider,
            plot,
            dungeon.name as string,
            dungeon.alias as string,
            {},
            (current, total) => {
              notify({ type: "scene_generating", current, total });
            },
          ).andThen((scenes) => {
            // 各シーン完了を通知
            notify({
              type: "scene_complete",
              current: scenes.length,
              total: scenes.length,
            });

            logger.info("All scenes generated", { count: scenes.length });

            // Step 5: エピローグ生成
            const allScenesText = scenes.map((s) => s.text).join("\n\n");
            const epilogueInput: EpilogueGenerationInput = {
              plot,
              dungeonName: dungeon.name as string,
              allScenesText,
            };

            return generateEpilogue(llmProvider, epilogueInput).andThen(
              (epilogue) => {
                logger.debug("Epilogue generated", { length: epilogue.length });

                // Step 6: リプレイ構築
                return buildReplay(
                  replayId,
                  sessionId,
                  party,
                  dungeon,
                  plot,
                  epigraph,
                  scenes,
                  epilogue,
                ).map((replay) => {
                  logger.info("Replay built successfully", {
                    replayId,
                    totalCharCount: replay.totalCharCount,
                  });

                  notify({
                    type: "completed",
                    replayId,
                    totalCharCount: replay.totalCharCount,
                  });

                  return {
                    replay,
                    triggeredEvents: resonanceResult.triggeredEvents,
                    plot,
                  };
                });
              },
            );
          });
        },
      );
    })
    .mapErr((error) => {
      logger.error("Pipeline failed", { error });
      notify({ type: "failed", error: error.message });
      return error;
    });
}

// ========================================
// Helpers
// ========================================

/**
 * リプレイを構築
 */
function buildReplay(
  replayId: ReplayId,
  sessionId: SessionId,
  party: readonly Character[],
  dungeon: Dungeon,
  plot: GeneratedPlot,
  epigraph: string,
  generatedScenes: readonly GeneratedScene[],
  epilogue: string,
): ResultAsync<Replay, LLMServiceError> {
  // ヘッダー構築
  const partyInfo: PartyMemberInfo[] = party.map((char) => ({
    id: char.id,
    name: char.name as string,
    title: char.title as string,
  }));

  const outcomeType = mapOutcomeType(plot.resolution.outcome);

  const header: ReplayHeader = {
    dungeonName: dungeon.name as string,
    dungeonAlias: dungeon.alias as string,
    party: partyInfo,
    depthReached: dungeon.layerCount,
    outcomeType,
  };

  // シーン変換
  const scenes: Scene[] = generatedScenes.map((gs) => ({
    number: gs.number,
    title: gs.title,
    text: gs.text,
  }));

  // フッター構築（キャラクター変化は生成された情報から推測）
  const characterChanges: CharacterChange[] = parseCharacterChanges(
    plot.resolution.changed,
    party,
  );

  const footer: ReplayFooter = {
    sessionDate: generateGameDate(),
    survivors: `${party.length}/${party.length}`,
    characterChanges,
  };

  // リプレイ作成
  const result = createReplay({
    id: replayId,
    sessionId,
    header,
    epigraph,
    scenes,
    epilogue,
    footer,
  });

  if (result.isErr()) {
    return errAsync(
      Errors.llm("validation", result.error.message) as LLMServiceError,
    );
  }

  return okAsync(result.value);
}

/**
 * 結末テキストからOutcomeTypeを推測
 */
function mapOutcomeType(outcomeText: string): OutcomeType {
  const text = outcomeText.toLowerCase();

  if (text.includes("解放") || text.includes("救") || text.includes("光")) {
    return OutcomeTypes.LIBERATION;
  }
  if (text.includes("喪失") || text.includes("失") || text.includes("死")) {
    return OutcomeTypes.LOSS;
  }
  if (text.includes("発見") || text.includes("真実") || text.includes("知")) {
    return OutcomeTypes.DISCOVERY;
  }
  if (text.includes("選択") || text.includes("選") || text.includes("決断")) {
    return OutcomeTypes.CHOICE;
  }
  if (text.includes("対決") || text.includes("戦") || text.includes("勝")) {
    return OutcomeTypes.CONFRONTATION;
  }

  // デフォルト
  return OutcomeTypes.DISCOVERY;
}

/**
 * キャラクター変化テキストを解析
 */
function parseCharacterChanges(
  changedText: string,
  party: readonly Character[],
): CharacterChange[] {
  const changes: CharacterChange[] = [];

  for (const char of party) {
    const charName = char.name as string;

    // テキストにキャラクター名が含まれているか確認
    if (changedText.includes(charName)) {
      // 変化タイプを推測
      let changeType: ChangeType = ChangeTypes.INNER;
      if (changedText.includes("傷") || changedText.includes("負傷")) {
        changeType = ChangeTypes.WOUND;
      } else if (changedText.includes("関係") || changedText.includes("絆")) {
        changeType = ChangeTypes.RELATIONSHIP;
      }

      changes.push({
        characterId: char.id,
        characterName: charName,
        changeType,
        description: extractChangeDescription(changedText, charName),
      });
    } else {
      // 言及されていないキャラクターは変化なし
      changes.push({
        characterId: char.id,
        characterName: charName,
        changeType: ChangeTypes.UNCHANGED,
        description: "特に変化なし",
      });
    }
  }

  return changes;
}

/**
 * キャラクターの変化説明を抽出
 */
function extractChangeDescription(text: string, charName: string): string {
  // 簡易的な抽出：キャラクター名を含む部分を抽出
  const parts = text.split(/[、。]/);
  for (const part of parts) {
    if (part.includes(charName)) {
      return part.trim();
    }
  }
  return "内面に変化があった";
}

/**
 * ゲーム内日付を生成
 */
function generateGameDate(): string {
  // 灰暦（Ashen Calendar）の日付を生成
  const year = 847 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;

  const months = [
    "始まりの月",
    "霜月",
    "灰降月",
    "芽吹月",
    "花散月",
    "陽炎月",
    "盛夏月",
    "収穫月",
    "落葉月",
    "霧深月",
    "凍土月",
    "終わりの月",
  ];

  return `灰暦${year}年 ${months[month - 1]}${day}日`;
}
