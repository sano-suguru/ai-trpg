import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Service Role API による認証で安定（ローカルAPIサーバーの負荷を考慮し1に制限）
  // CI環境ではリソースに余裕があれば2に増やすことを検討
  workers: process.env.CI ? 2 : 1,
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

    // スクショ: 失敗時のみ
    screenshot: "only-on-failure",

    // 動画: 失敗時のみ
    video: "retain-on-failure",

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
  // 両サーバーが準備できるまでPlaywrightが待機する
  webServer: [
    {
      name: "API",
      command: "pnpm --filter @ai-trpg/api dev",
      url: "http://localhost:8787/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: "../..",
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      name: "Web",
      command: "pnpm --filter @ai-trpg/web dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: "../..",
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
