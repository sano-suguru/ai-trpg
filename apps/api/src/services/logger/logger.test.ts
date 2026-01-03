/**
 * ロガーユニットテスト
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "./logger";

// context モジュールをモック
vi.mock("./context", () => ({
  getRequestContext: vi.fn(() => undefined),
}));

// モック関数を取得
import { getRequestContext } from "./context";
const mockedGetRequestContext = vi.mocked(getRequestContext);

// JSON文字列からログエントリをパースするヘルパー
const parseLogEntry = (jsonString: string): Record<string, unknown> =>
  JSON.parse(jsonString) as Record<string, unknown>;

describe("createLogger", () => {
  // console メソッドをモック
  const mockDebug = vi.fn();
  const mockInfo = vi.fn();
  const mockWarn = vi.fn();
  const mockError = vi.fn();

  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockDebug.mockClear();
    mockInfo.mockClear();
    mockWarn.mockClear();
    mockError.mockClear();
    mockedGetRequestContext.mockClear();
    mockedGetRequestContext.mockReturnValue(undefined);

    vi.spyOn(console, "debug").mockImplementation(mockDebug);
    vi.spyOn(console, "info").mockImplementation(mockInfo);
    vi.spyOn(console, "warn").mockImplementation(mockWarn);
    vi.spyOn(console, "error").mockImplementation(mockError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ログ出力形式", () => {
    it("JSON文字列を出力する（NDJSON形式）", () => {
      const logger = createLogger("TestLogger");
      logger.info("Test message");

      expect(mockInfo).toHaveBeenCalledTimes(1);
      const rawOutput = mockInfo.mock.calls[0][0];
      expect(typeof rawOutput).toBe("string");

      const logEntry = parseLogEntry(rawOutput);
      expect(logEntry).toMatchObject({
        name: "TestLogger",
        level: "info",
        message: "Test message",
      });
      expect(logEntry.timestamp).toBeDefined();
    });

    it("コンテキストがトップレベルに展開される", () => {
      const logger = createLogger("TestLogger");
      logger.info("Request started", { provider: "groq", model: "llama3" });

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.provider).toBe("groq");
      expect(logEntry.model).toBe("llama3");
    });

    it("各ログレベルで正しいconsoleメソッドが呼ばれる", () => {
      const logger = createLogger("TestLogger");

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(mockDebug).toHaveBeenCalledTimes(1);
      expect(mockInfo).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledTimes(1);

      expect(parseLogEntry(mockDebug.mock.calls[0][0]).level).toBe("debug");
      expect(parseLogEntry(mockInfo.mock.calls[0][0]).level).toBe("info");
      expect(parseLogEntry(mockWarn.mock.calls[0][0]).level).toBe("warn");
      expect(parseLogEntry(mockError.mock.calls[0][0]).level).toBe("error");
    });
  });

  describe("ログレベルフィルタリング", () => {
    it("minLevel: info でdebugログは出力されない", () => {
      const logger = createLogger("TestLogger", { minLevel: "info" });

      logger.debug("should not appear");
      logger.info("should appear");

      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalledTimes(1);
    });

    it("minLevel: warn でinfo以下は出力されない", () => {
      const logger = createLogger("TestLogger", { minLevel: "warn" });

      logger.debug("should not appear");
      logger.info("should not appear");
      logger.warn("should appear");
      logger.error("should appear");

      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledTimes(1);
    });

    it("minLevel: error でerrorのみ出力される", () => {
      const logger = createLogger("TestLogger", { minLevel: "error" });

      logger.debug("should not appear");
      logger.info("should not appear");
      logger.warn("should not appear");
      logger.error("should appear");

      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockError).toHaveBeenCalledTimes(1);
    });

    it("デフォルトはdebug（すべて出力）", () => {
      const logger = createLogger("TestLogger");

      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(mockDebug).toHaveBeenCalledTimes(1);
      expect(mockInfo).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledTimes(1);
    });
  });

  describe("子ロガー", () => {
    it("名前空間が継承される", () => {
      const logger = createLogger("LLMService");
      const retryLogger = logger.child("retry");

      retryLogger.info("Attempting retry");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.name).toBe("LLMService:retry");
    });

    it("親のminLevelが継承される", () => {
      const logger = createLogger("LLMService", { minLevel: "warn" });
      const retryLogger = logger.child("retry");

      retryLogger.debug("should not appear");
      retryLogger.info("should not appear");
      retryLogger.warn("should appear");

      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledTimes(1);
    });

    it("複数階層の子ロガーを作成できる", () => {
      const logger = createLogger("Service");
      const childLogger = logger.child("module").child("function");

      childLogger.info("Nested log");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.name).toBe("Service:module:function");
    });
  });

  describe("リクエストコンテキスト連携", () => {
    it("コンテキストがある場合requestIdが付与される", () => {
      mockedGetRequestContext.mockReturnValue({
        requestId: "abc12345",
      });

      const logger = createLogger("TestLogger");
      logger.info("Request log");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.requestId).toBe("abc12345");
    });

    it("コンテキストにuserIdがある場合付与される", () => {
      mockedGetRequestContext.mockReturnValue({
        requestId: "abc12345",
        userId: "user-123",
      });

      const logger = createLogger("TestLogger");
      logger.info("User action");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.requestId).toBe("abc12345");
      expect(logEntry.userId).toBe("user-123");
    });

    it("コンテキストがない場合requestIdは付与されない", () => {
      mockedGetRequestContext.mockReturnValue(undefined);

      const logger = createLogger("TestLogger");
      logger.info("No context");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      expect(logEntry.requestId).toBeUndefined();
    });
  });

  describe("タイムスタンプ", () => {
    it("ISO8601形式のタイムスタンプが含まれる", () => {
      const logger = createLogger("TestLogger");
      logger.info("Test");

      const logEntry = parseLogEntry(mockInfo.mock.calls[0][0]);
      // ISO8601形式: 2024-01-01T00:00:00.000Z
      expect(logEntry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
