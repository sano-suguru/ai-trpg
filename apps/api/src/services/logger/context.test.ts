/**
 * リクエストコンテキストユニットテスト
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getRequestContext,
  runWithContext,
  updateContext,
  generateRequestId,
} from "./context";

describe("リクエストコンテキスト", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getRequestContext", () => {
    it("コンテキスト外ではundefinedを返す", () => {
      const context = getRequestContext();
      expect(context).toBeUndefined();
    });

    it("runWithContext内ではコンテキストを取得できる", () => {
      const testContext = { requestId: "test-123" };

      runWithContext(testContext, () => {
        const context = getRequestContext();
        expect(context).toEqual(testContext);
      });
    });
  });

  describe("runWithContext", () => {
    it("同期関数を実行できる", () => {
      const result = runWithContext({ requestId: "sync-test" }, () => {
        return "sync result";
      });

      expect(result).toBe("sync result");
    });

    it("非同期関数を実行できる", async () => {
      const result = await runWithContext(
        { requestId: "async-test" },
        async () => {
          await Promise.resolve();
          return "async result";
        },
      );

      expect(result).toBe("async result");
    });

    it("ネストされたコンテキストは内側が優先される", () => {
      const outerContext = { requestId: "outer" };
      const innerContext = { requestId: "inner" };

      runWithContext(outerContext, () => {
        expect(getRequestContext()?.requestId).toBe("outer");

        runWithContext(innerContext, () => {
          expect(getRequestContext()?.requestId).toBe("inner");
        });

        // 外側に戻る
        expect(getRequestContext()?.requestId).toBe("outer");
      });
    });

    it("userIdを含むコンテキストを設定できる", () => {
      const context = { requestId: "req-123", userId: "user-456" };

      runWithContext(context, () => {
        const ctx = getRequestContext();
        expect(ctx?.requestId).toBe("req-123");
        expect(ctx?.userId).toBe("user-456");
      });
    });

    it("pathとmethodを含むコンテキストを設定できる", () => {
      const context = {
        requestId: "req-123",
        path: "/trpc/character.create",
        method: "POST",
      };

      runWithContext(context, () => {
        const ctx = getRequestContext();
        expect(ctx?.path).toBe("/trpc/character.create");
        expect(ctx?.method).toBe("POST");
      });
    });
  });

  describe("updateContext", () => {
    it("既存コンテキストがない場合は新規作成される", () => {
      updateContext({ userId: "new-user" }, () => {
        const ctx = getRequestContext();
        expect(ctx?.userId).toBe("new-user");
        // requestIdは自動生成される
        expect(ctx?.requestId).toBeDefined();
      });
    });

    it("既存コンテキストを部分更新できる", () => {
      const originalContext = { requestId: "original-123" };

      runWithContext(originalContext, () => {
        updateContext({ userId: "updated-user" }, () => {
          const ctx = getRequestContext();
          // requestIdは保持される
          expect(ctx?.requestId).toBe("original-123");
          // userIdは追加される
          expect(ctx?.userId).toBe("updated-user");
        });
      });
    });

    it("既存フィールドを上書きできる", () => {
      const originalContext = { requestId: "original", userId: "user-1" };

      runWithContext(originalContext, () => {
        updateContext({ userId: "user-2" }, () => {
          const ctx = getRequestContext();
          expect(ctx?.userId).toBe("user-2");
        });
      });
    });
  });

  describe("generateRequestId", () => {
    it("8文字のIDを生成する", () => {
      const id = generateRequestId();
      expect(id).toHaveLength(8);
    });

    it("16進数文字列を返す", () => {
      const id = generateRequestId();
      expect(id).toMatch(/^[0-9a-f]{8}$/);
    });

    it("呼び出しごとに異なるIDを生成する", () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("非同期コンテキスト伝播", () => {
    it("Promise.allでコンテキストが伝播する", async () => {
      const context = { requestId: "promise-all-test", userId: "user-123" };

      await runWithContext(context, async () => {
        const results = await Promise.all([
          Promise.resolve().then(() => getRequestContext()?.requestId),
          Promise.resolve().then(() => getRequestContext()?.userId),
        ]);

        expect(results).toEqual(["promise-all-test", "user-123"]);
      });
    });

    it("setTimeoutでコンテキストが伝播する", async () => {
      const context = { requestId: "timeout-test" };

      await runWithContext(context, async () => {
        const result = await new Promise<string | undefined>((resolve) => {
          setTimeout(() => {
            resolve(getRequestContext()?.requestId);
          }, 10);
        });

        expect(result).toBe("timeout-test");
      });
    });
  });
});
