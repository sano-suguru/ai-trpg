/**
 * セッション生成サービス
 *
 * バレルエクスポート
 */

// Resonance
export {
  scanResonance,
  filterHighPriorityEvents,
  groupEventsByCharacter,
  type CharacterForResonance,
  type ResonanceScanResult,
} from "./resonance";

// Plot
export {
  generatePlot,
  type GeneratedPlot,
  type PlotGenerationOptions,
} from "./plot";

// Scene
export {
  generateScene,
  generateAllScenes,
  generateEpigraph,
  generateEpilogue,
  type GeneratedScene,
  type SceneGenerationOptions,
  type SceneProgressCallback,
} from "./scene";

// Pipeline
export {
  runGenerationPipeline,
  type PipelineInput,
  type PipelineConfig,
  type PipelineResult,
  type GenerationEvent,
  type ProgressCallback,
} from "./pipeline";

// Prompts (for testing/debugging)
export {
  PLOT_SYSTEM_PROMPT,
  buildPlotPrompt,
  parsePlotResponse,
  type PlotGenerationInput,
} from "./prompts/plot";

export {
  SCENE_SYSTEM_PROMPT,
  buildScenePrompt,
  EPIGRAPH_SYSTEM_PROMPT,
  buildEpigraphPrompt,
  EPILOGUE_SYSTEM_PROMPT,
  buildEpiloguePrompt,
  type SceneGenerationInput,
  type EpigraphGenerationInput,
  type EpilogueGenerationInput,
} from "./prompts/scene";
