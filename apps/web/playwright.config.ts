import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4, // 要素待機方式で並列実行可能
  timeout: 30000, // 各テストのタイムアウト（デフォルト30秒）
  expect: {
    timeout: 15000, // expectのデフォルトタイムアウト
  },
  reporter: [
    ["html", { open: "never", outputFolder: "./playwright-report" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:5173",

    // スクショ: 常に撮影（実装検証のため）
    screenshot: "on",

    // 動画: 常に撮影（実装検証のため）
    video: "on",

    // トレース: 失敗時のみ
    trace: "on-first-retry",
  },

  // 出力ディレクトリ
  outputDir: "./test-results",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // ローカル開発サーバー（web + api）
  // ローカルでは既存サーバーを再利用、CIでは新規起動
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    cwd: "../..",
  },
});
