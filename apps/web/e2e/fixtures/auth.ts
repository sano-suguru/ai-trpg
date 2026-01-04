/**
 * E2E テスト用認証 Fixture
 *
 * Worker Fixture パターンで各ワーカーごとに1回だけ認証を実行し、
 * storageState ファイルに保存して再利用する。
 *
 * 使い方:
 * ```typescript
 * import { test, expect } from "./fixtures/auth";
 *
 * test("認証が必要なテスト", async ({ page }) => {
 *   // 自動的に認証済み状態
 * });
 * ```
 */

import { test as baseTest, expect } from "@playwright/test";
import {
  createTestUser,
  getAuthConfig,
  deleteTestUser,
  WEB_APP_URL,
} from "../auth-setup";
import fs from "fs";
import path from "path";

// ========================================
// 認証済み Test Fixture
// ========================================

export const test = baseTest.extend<object, { workerStorageState: string }>({
  // storageState ファイルパスを使用
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Worker ごとに1回だけセッション取得して storageState ファイルに保存
  workerStorageState: [
    async ({ browser }, use, testInfo) => {
      // storageState ファイルのパスを生成
      const id = testInfo.parallelIndex;
      const fileName = path.resolve(
        testInfo.project.outputDir,
        `.auth/${id}.json`,
      );

      // 既存の認証状態があれば再利用
      if (fs.existsSync(fileName)) {
        await use(fileName);
        return;
      }

      // 認証ディレクトリを作成
      fs.mkdirSync(path.dirname(fileName), { recursive: true });

      // テストユーザーを作成（Admin API）
      await createTestUser(id);

      // 認証情報を取得（Node.js側で環境変数を解決）
      const { email, password } = getAuthConfig(id);

      // 新しいコンテキストでブラウザを開く
      const context = await browser.newContext();
      const page = await context.newPage();

      // ページを開いてブラウザ内でサインイン
      // Viteがモジュールを提供するため、/src/... パスでインポート可能
      await page.goto(WEB_APP_URL, { waitUntil: "networkidle" });

      await page.evaluate(
        async ({ email, password }) => {
          // Vite開発サーバーがこのパスを変換してモジュールを提供
          // @ts-expect-error - Vite serves this module
          const { supabase } = await import("/src/lib/supabase.ts");
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            throw new Error(
              `Login failed: ${error.message || error.name || JSON.stringify(error)}`,
            );
          }
        },
        { email, password },
      );

      // セッションが保存されるまで少し待機
      await page.waitForTimeout(500);

      // Playwright の storageState() で保存
      await context.storageState({ path: fileName });
      await context.close();

      await use(fileName);

      // Worker 終了時にテストユーザーを削除（クリーンアップ）
      await deleteTestUser(id);
    },
    { scope: "worker", timeout: 60000 },
  ],
});

// baseTest も export して未認証テスト用に使えるようにする
export { baseTest, expect };
