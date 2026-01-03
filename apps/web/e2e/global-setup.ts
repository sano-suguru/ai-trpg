/**
 * Playwright グローバルセットアップ
 *
 * E2Eテスト実行前に一度だけ実行される
 * シードデータの投入を行う
 */

import { execSync } from "node:child_process";

export default async function globalSetup(): Promise<void> {
  // シードコマンドを実行（既に投入済みでもエラーにならない設計）
  // stdio: "inherit" により出力はそのまま表示される
  execSync("pnpm --filter @ai-trpg/api seed", {
    stdio: "inherit",
    cwd: "../..", // apps/web から monorepo root へ
  });
}
