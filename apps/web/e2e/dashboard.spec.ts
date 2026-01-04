/**
 * マイページ (/dashboard) のE2Eテスト
 *
 * テスト対象:
 * - 未ログイン時のリダイレクト
 * - ダッシュボード表示
 * - キャラクター作成への遷移
 */

import { test, baseTest, expect } from "./fixtures/auth";

// ========================================
// テスト
// ========================================

// 認証チェック（storageState なし）
baseTest.describe("ダッシュボード認証チェック", () => {
  baseTest(
    "未ログイン時はログインページにリダイレクトされる",
    async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    },
  );
});

// 認証が必要なテスト
test.describe("ダッシュボード", () => {
  test("ダッシュボードが表示される", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "マイページ" }),
    ).toBeVisible();
    await expect(page.getByText("あなたの物語の拠点")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "キャラクター" }),
    ).toBeVisible();
  });

  test("新規作成ボタンからキャラクター作成へ遷移できる", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("link", { name: "+ 新規作成" }).click();

    await expect(page).toHaveURL("/characters/new");
    await expect(
      page.getByRole("heading", { name: "キャラクター作成" }),
    ).toBeVisible();
  });

  test("キャラクターがない場合は空状態が表示される", async ({ page }) => {
    // 他のテストで作成されたキャラクターを削除してクリーンな状態にする
    // TODO: 削除UIが実装されたら、UI経由での削除に変更する
    // See: .claude/tasks/feature-dashboard-delete-character.md
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 既存のキャラクターをtRPC経由で全て削除
    await page.evaluate(async () => {
      // @ts-expect-error - Vite serves this module
      const { createTrpcClient } = await import("/src/lib/trpc.ts");
      const trpcClient = createTrpcClient();
      const characters = await trpcClient.character.listMine.query();
      for (const char of characters) {
        await trpcClient.character.delete.mutate({ id: char.id });
      }
    });

    // ページをリロードして空状態を確認
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 空状態の表示を待つ（API読み込み完了後）
    const emptyStateText = page.getByText("まだキャラクターがいません");
    await emptyStateText.waitFor({ state: "visible", timeout: 30000 });

    await expect(
      page.getByText("最初のキャラクターを作成して、物語を始めましょう"),
    ).toBeVisible();

    // CTAボタン
    const ctaButton = page.getByRole("link", {
      name: "キャラクターを作成する",
    });
    await expect(ctaButton).toBeVisible();

    // CTAからキャラクター作成へ遷移
    await ctaButton.click();
    await expect(page).toHaveURL("/characters/new");
  });
});
