/**
 * 構造化ログモジュール
 *
 * Cloudflare Workers環境向けの構造化ログ基盤
 *
 * @example
 * ```typescript
 * import { createLogger, runWithContext, generateRequestId } from "./services/logger";
 *
 * // リクエストハンドラ内でコンテキストを設定
 * await runWithContext(
 *   { requestId: generateRequestId(), userId: user?.id, path: "/api/foo" },
 *   async () => {
 *     const logger = createLogger("MyService");
 *     // すべてのログに requestId, userId が自動付与される
 *     logger.info("Operation completed", { duration: 150 });
 *   }
 * );
 * ```
 */

export { createLogger } from "./logger";
export type { Logger, LoggerConfig, LogLevel } from "./types";
export {
  runWithContext,
  updateContext,
  getRequestContext,
  generateRequestId,
  type RequestContext,
} from "./context";
