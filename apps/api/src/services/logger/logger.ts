/**
 * 構造化ログユーティリティ
 *
 * Cloudflare Workers Logs のベストプラクティスに従った実装:
 * - console.log/debug/info/warn/error にJSONオブジェクトを渡す
 * - フィールドが自動的にインデックス化される
 * - wrangler tail や Workers Logs ダッシュボードで確認可能
 * - AsyncLocalStorageによるリクエストコンテキストの自動付与
 *
 * @see https://developers.cloudflare.com/workers/observability/logs/workers-logs/
 */

import type { Logger, LoggerConfig, LogLevel } from "./types";
import { LOG_LEVEL_PRIORITY } from "./types";
import { getRequestContext } from "./context";

/**
 * 現在のログレベルを取得
 * 環境変数 LOG_LEVEL が設定されていればそれを使用、なければデフォルト
 */
function getMinLevel(config?: LoggerConfig): LogLevel {
  // Cloudflare Workers では環境変数は Env オブジェクト経由だが、
  // グローバルなロガー設定としてはconfigで渡すか、デフォルトを使用
  return config?.minLevel ?? "debug";
}

/**
 * ログレベルが出力対象かどうか判定
 */
function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * ログエントリを構築
 * Cloudflare Workers Logs で自動インデックス化されるJSON形式
 *
 * リクエストコンテキストがある場合は自動的に以下のフィールドを追加:
 * - requestId: リクエストを追跡するための一意のID
 * - userId: 認証済みユーザーID（存在する場合）
 */
function buildLogEntry(
  name: string,
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): Record<string, unknown> {
  const requestContext = getRequestContext();

  const entry: Record<string, unknown> = {
    name,
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  // リクエストコンテキストから横断的な属性を追加
  if (requestContext) {
    entry.requestId = requestContext.requestId;
    if (requestContext.userId) {
      entry.userId = requestContext.userId;
    }
  }

  // contextのフィールドをトップレベルに展開（インデックス化のため）
  if (context) {
    Object.assign(entry, context);
  }

  return entry;
}

/**
 * Logger実装クラス
 */
class LoggerImpl implements Logger {
  private readonly name: string;
  private readonly minLevel: LogLevel;

  constructor(name: string, config?: LoggerConfig) {
    this.name = name;
    this.minLevel = getMinLevel(config);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog("debug", this.minLevel)) return;
    const entry = buildLogEntry(this.name, "debug", message, context);
    console.debug(JSON.stringify(entry));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog("info", this.minLevel)) return;
    const entry = buildLogEntry(this.name, "info", message, context);
    console.info(JSON.stringify(entry));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog("warn", this.minLevel)) return;
    const entry = buildLogEntry(this.name, "warn", message, context);
    console.warn(JSON.stringify(entry));
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog("error", this.minLevel)) return;
    const entry = buildLogEntry(this.name, "error", message, context);
    console.error(JSON.stringify(entry));
  }

  child(namespace: string): Logger {
    return new LoggerImpl(`${this.name}:${namespace}`, {
      minLevel: this.minLevel,
    });
  }
}

/**
 * ロガーを作成
 *
 * @param name - ロガーの名前（例: "LLMService", "CharacterRouter"）
 * @param config - オプションの設定
 * @returns Logger インスタンス
 *
 * @example
 * ```typescript
 * const logger = createLogger("LLMService");
 *
 * logger.info("Request started", { provider: "groq", model: "llama3" });
 * // 出力: { name: "LLMService", level: "info", message: "Request started", provider: "groq", model: "llama3", timestamp: "..." }
 *
 * logger.error("Provider failed", { provider: "groq", errorCode: "RATE_LIMITED" });
 *
 * const retryLogger = logger.child("retry");
 * retryLogger.debug("Attempting retry", { attempt: 2 });
 * // 出力: { name: "LLMService:retry", level: "debug", ... }
 * ```
 */
export function createLogger(name: string, config?: LoggerConfig): Logger {
  return new LoggerImpl(name, config);
}
