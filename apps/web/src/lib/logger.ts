/**
 * フロントエンド用軽量ロガー
 *
 * 開発時: 全レベル出力
 * 本番: warn/error のみ出力
 *
 * @example
 * ```typescript
 * import { logger } from "@/lib/logger";
 *
 * logger.debug("State changed", { newState });
 * logger.info("User action", { action: "click", target: "submit" });
 * logger.warn("Deprecated API used");
 * logger.error("Failed to fetch", { error });
 * ```
 */

type LogContext = Record<string, unknown>;

// Vite環境変数で開発モード判定
const isDev = import.meta.env.DEV;

const debugFn = isDev ? console.debug.bind(console) : () => {};
const infoFn = isDev ? console.info.bind(console) : () => {};
const warnFn = console.warn.bind(console);
const errorFn = console.error.bind(console);

/**
 * フロントエンド用ロガー
 *
 * API側のロガーと同じインターフェースを持つが、
 * ブラウザ向けに最適化された軽量実装。
 */
export const logger = {
  /**
   * デバッグログ（開発時のみ出力）
   */
  debug(message: string, context?: LogContext): void {
    if (context !== undefined) {
      debugFn(`[DEBUG] ${message}`, context);
    } else {
      debugFn(`[DEBUG] ${message}`);
    }
  },

  /**
   * 情報ログ（開発時のみ出力）
   */
  info(message: string, context?: LogContext): void {
    if (context !== undefined) {
      infoFn(`[INFO] ${message}`, context);
    } else {
      infoFn(`[INFO] ${message}`);
    }
  },

  /**
   * 警告ログ（本番でも出力）
   */
  warn(message: string, context?: LogContext): void {
    if (context !== undefined) {
      warnFn(`[WARN] ${message}`, context);
    } else {
      warnFn(`[WARN] ${message}`);
    }
  },

  /**
   * エラーログ（本番でも出力）
   */
  error(message: string, context?: LogContext): void {
    if (context !== undefined) {
      errorFn(`[ERROR] ${message}`, context);
    } else {
      errorFn(`[ERROR] ${message}`);
    }
  },
};
