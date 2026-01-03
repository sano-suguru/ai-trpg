/**
 * ログレベル定義
 *
 * Cloudflare Workersがサポートする標準のconsoleメソッドに対応
 * @see https://developers.cloudflare.com/workers/runtime-apis/console/
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ログレベルの優先度（数値が大きいほど重要）
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger インターフェース
 *
 * Cloudflare Workers Logs のベストプラクティスに従い、
 * JSONオブジェクトを出力して自動インデックス化を活用
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;

  /**
   * 子ロガーを作成（名前空間を継承）
   * 例: logger.child("retry") → "LLMService:retry"
   */
  child(namespace: string): Logger;
}

/**
 * ログ設定
 */
export interface LoggerConfig {
  /**
   * 最小ログレベル（これ以上の優先度のログのみ出力）
   *
   * @default "debug"
   *
   * @remarks
   * 開発時は "debug" で全ログを確認可能。
   * 本番環境では "info" 以上を推奨（ログ量とパフォーマンスのバランス）。
   *
   * Cloudflare Workers では環境変数は Env オブジェクト経由のため、
   * モジュールレベルで作成するロガーには config 引数で明示的に渡すか、
   * Workers Logs ダッシュボードでフィルタリングする。
   */
  readonly minLevel?: LogLevel;
}
