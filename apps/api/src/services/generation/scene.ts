/**
 * シーン生成サービス
 *
 * LLMを使用して個別シーンのテキストを生成する
 */

import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { Errors } from "@ai-trpg/shared/types";
import type { LLMServiceError } from "../llm/types";
import type { LLMProvider } from "../llm/types";
import { createLogger } from "../logger";
import type { GeneratedPlot } from "./plot";
import type {
  SceneGenerationInput,
  EpigraphGenerationInput,
  EpilogueGenerationInput,
} from "./prompts/scene";
import {
  SCENE_SYSTEM_PROMPT,
  buildScenePrompt,
  EPIGRAPH_SYSTEM_PROMPT,
  buildEpigraphPrompt,
  EPILOGUE_SYSTEM_PROMPT,
  buildEpiloguePrompt,
} from "./prompts/scene";

// ========================================
// Types
// ========================================

/**
 * 生成されたシーン
 */
export interface GeneratedScene {
  readonly number: number;
  readonly title: string;
  readonly text: string;
}

/**
 * シーン生成オプション
 */
export interface SceneGenerationOptions {
  /** 温度パラメータ */
  readonly temperature?: number;
  /** タイムアウト（ミリ秒） */
  readonly timeout?: number;
}

/**
 * シーン生成進捗コールバック
 */
export type SceneProgressCallback = (
  sceneNumber: number,
  totalScenes: number,
  generatedText: string,
) => void;

// ========================================
// Constants
// ========================================

const logger = createLogger("SceneGeneration");

const DEFAULT_OPTIONS: Required<SceneGenerationOptions> = {
  temperature: 0.9, // シーン生成は創造性重視
  timeout: 30000,
};

const MIN_SCENE_LENGTH = 300;
const MAX_SCENE_LENGTH = 800;

// ========================================
// Scene Generation
// ========================================

/**
 * 単一シーンを生成
 */
export function generateScene(
  provider: LLMProvider,
  input: SceneGenerationInput,
  options: SceneGenerationOptions = {},
): ResultAsync<GeneratedScene, LLMServiceError> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const prompt = buildScenePrompt(input);

  logger.debug("Generating scene", {
    sceneNumber: input.sceneNumber,
    title: input.sceneTitle,
    characterFocus: input.characterFocus,
  });

  return provider
    .generate(prompt, {
      systemPrompt: SCENE_SYSTEM_PROMPT,
      temperature: mergedOptions.temperature,
      timeout: mergedOptions.timeout,
      maxTokens: 1000,
    })
    .andThen((result) => {
      const text = result.text.trim();

      // 長さチェック
      if (text.length < MIN_SCENE_LENGTH) {
        logger.warn("Scene text too short", {
          sceneNumber: input.sceneNumber,
          length: text.length,
        });
        return errAsync(
          Errors.llm(
            "validation",
            `シーン${input.sceneNumber}のテキストが短すぎます: ${text.length}文字`,
          ) as LLMServiceError,
        );
      }

      if (text.length > MAX_SCENE_LENGTH) {
        logger.warn("Scene text too long, truncating", {
          sceneNumber: input.sceneNumber,
          length: text.length,
        });
        // 長すぎる場合は切り詰める（文末で）
        const truncated = truncateAtSentence(text, MAX_SCENE_LENGTH);
        return okAsync({
          number: input.sceneNumber,
          title: input.sceneTitle,
          text: truncated,
        });
      }

      return okAsync({
        number: input.sceneNumber,
        title: input.sceneTitle,
        text,
      });
    });
}

/**
 * 全シーンを順次生成
 */
export function generateAllScenes(
  provider: LLMProvider,
  plot: GeneratedPlot,
  dungeonName: string,
  dungeonAlias: string,
  options: SceneGenerationOptions = {},
  onProgress?: SceneProgressCallback,
): ResultAsync<readonly GeneratedScene[], LLMServiceError> {
  const scenes: GeneratedScene[] = [];
  const totalScenes = plot.scenes.length;

  logger.info("Starting all scenes generation", {
    totalScenes,
    dungeonName,
  });

  // 順次生成（前シーンの文脈が必要なため並列化不可）
  const generateNext = (
    index: number,
  ): ResultAsync<readonly GeneratedScene[], LLMServiceError> => {
    if (index >= totalScenes) {
      logger.info("All scenes generated", { count: scenes.length });
      return okAsync(scenes);
    }

    const plotScene = plot.scenes[index];
    const previousSceneText = index > 0 ? scenes[index - 1].text : null;
    const isLastScene = index === totalScenes - 1;

    const input: SceneGenerationInput = {
      sceneNumber: plotScene.number,
      sceneTitle: plotScene.title,
      sceneSummary: plotScene.summary,
      characterFocus: plotScene.characterFocus,
      triggeredResonance: plotScene.triggeredResonance,
      dungeonName,
      dungeonAlias,
      plot,
      previousSceneText,
      isLastScene,
    };

    return generateScene(provider, input, options).andThen((scene) => {
      scenes.push(scene);

      // 進捗コールバック
      if (onProgress) {
        onProgress(scene.number, totalScenes, scene.text);
      }

      logger.debug("Scene generated", {
        sceneNumber: scene.number,
        title: scene.title,
        length: scene.text.length,
      });

      return generateNext(index + 1);
    });
  };

  return generateNext(0);
}

// ========================================
// Epigraph Generation
// ========================================

/**
 * エピグラフを生成
 */
export function generateEpigraph(
  provider: LLMProvider,
  input: EpigraphGenerationInput,
  options: SceneGenerationOptions = {},
): ResultAsync<string, LLMServiceError> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const prompt = buildEpigraphPrompt(input);

  logger.debug("Generating epigraph", {
    dungeonName: input.dungeonName,
  });

  return provider
    .generate(prompt, {
      systemPrompt: EPIGRAPH_SYSTEM_PROMPT,
      temperature: 0.7, // エピグラフは少し抑えめ
      timeout: mergedOptions.timeout,
      maxTokens: 200,
    })
    .map((result) => result.text.trim());
}

// ========================================
// Epilogue Generation
// ========================================

/**
 * エピローグを生成
 */
export function generateEpilogue(
  provider: LLMProvider,
  input: EpilogueGenerationInput,
  options: SceneGenerationOptions = {},
): ResultAsync<string, LLMServiceError> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const prompt = buildEpiloguePrompt(input);

  logger.debug("Generating epilogue", {
    dungeonName: input.dungeonName,
  });

  return provider
    .generate(prompt, {
      systemPrompt: EPILOGUE_SYSTEM_PROMPT,
      temperature: mergedOptions.temperature,
      timeout: mergedOptions.timeout,
      maxTokens: 600,
    })
    .map((result) => result.text.trim());
}

// ========================================
// Helpers
// ========================================

/**
 * 文末で切り詰める
 */
function truncateAtSentence(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // 最大長以内で最後の文末を探す
  const truncated = text.slice(0, maxLength);
  const lastPeriod = Math.max(
    truncated.lastIndexOf("。"),
    truncated.lastIndexOf("」"),
    truncated.lastIndexOf("…"),
  );

  if (lastPeriod > maxLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }

  // 文末が見つからない場合は単純に切り詰める
  return truncated + "…";
}
