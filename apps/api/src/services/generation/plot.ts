/**
 * プロット生成サービス
 *
 * LLMを使用してセッションのプロット骨子を生成する
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type { LLMServiceError } from "../llm/types";
import type { LLMProvider } from "../llm/types";
import { createLogger } from "../logger";
import type { PlotGenerationInput } from "./prompts/plot";
import {
  PLOT_SYSTEM_PROMPT,
  buildPlotPrompt,
  parsePlotResponse,
} from "./prompts/plot";

// ========================================
// Types
// ========================================

/**
 * プロット構造（生成結果）
 */
export interface GeneratedPlot {
  readonly opening: {
    readonly scene: string;
    readonly partyDynamic: string;
    readonly hook: string;
  };
  readonly scenes: ReadonlyArray<{
    readonly number: number;
    readonly title: string;
    readonly summary: string;
    readonly characterFocus: string | null;
    readonly triggeredResonance: string | null;
  }>;
  readonly climax: {
    readonly confrontation: string;
    readonly choiceBearer: string;
    readonly resonancePayoff: string | null;
  };
  readonly resolution: {
    readonly outcome: string;
    readonly cost: string;
    readonly changed: string;
  };
}

/**
 * プロット生成オプション
 */
export interface PlotGenerationOptions {
  /** 温度パラメータ */
  readonly temperature?: number;
  /** タイムアウト（ミリ秒） */
  readonly timeout?: number;
}

// ========================================
// Constants
// ========================================

const logger = createLogger("PlotGeneration");

const DEFAULT_OPTIONS: Required<PlotGenerationOptions> = {
  temperature: 0.8,
  timeout: 60000, // プロット生成は複雑なため長めに設定
};

// ========================================
// Service
// ========================================

/**
 * プロットを生成
 *
 * @param provider LLMプロバイダー（Geminiを推奨）
 * @param input 生成入力（パーティ、ダンジョン、発火イベント）
 * @param options 生成オプション
 * @returns 生成されたプロットまたはエラー
 */
export function generatePlot(
  provider: LLMProvider,
  input: PlotGenerationInput,
  options: PlotGenerationOptions = {},
): ResultAsync<GeneratedPlot, LLMServiceError> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const prompt = buildPlotPrompt(input);

  logger.info("Starting plot generation", {
    partySize: input.party.length,
    dungeonName: input.dungeon.name,
    triggeredEventCount: input.triggeredEvents.length,
  });

  return provider
    .generate(prompt, {
      systemPrompt: PLOT_SYSTEM_PROMPT,
      temperature: mergedOptions.temperature,
      timeout: mergedOptions.timeout,
      maxTokens: 4000, // プロット構造は比較的長い
    })
    .andThen((result) => {
      logger.debug("Received LLM response", {
        provider: result.provider,
        responseLength: result.text.length,
        tokens: result.tokens,
      });

      // JSONをパース（Result型を返す）
      const parseResult = parsePlotResponse(result.text);

      if (parseResult.isErr()) {
        logger.error("Failed to parse plot response", {
          error: parseResult.error.message,
          response: result.text.slice(0, 500),
        });
        return errAsync(
          Errors.llm("parse", parseResult.error.message) as LLMServiceError,
        );
      }

      const plot = parseResult.value;

      // バリデーション
      if (!plot.opening || !plot.scenes || !plot.climax || !plot.resolution) {
        logger.warn("Invalid plot structure", { plot });
        return errAsync(
          Errors.llm("parse", "プロット構造が不完全です") as LLMServiceError,
        );
      }

      if (plot.scenes.length < 5 || plot.scenes.length > 8) {
        logger.warn("Invalid scene count", {
          sceneCount: plot.scenes.length,
        });
        return errAsync(
          Errors.llm(
            "parse",
            `シーン数が範囲外です: ${plot.scenes.length}`,
          ) as LLMServiceError,
        );
      }

      logger.info("Plot generation completed", {
        sceneCount: plot.scenes.length,
        choiceBearer: plot.climax.choiceBearer,
      });

      return okAsync(plot as GeneratedPlot);
    });
}
