/**
 * ダンジョン機能のE2Eテスト
 *
 * 前提: シードデータが投入されていること
 * - 3件のサンプルダンジョン（忘却の聖堂、灰燼の街の廃墟、渡りの海の沈没船）
 */

import { expect, test } from "@playwright/test";
import { SEED_DUNGEONS } from "@ai-trpg/shared/fixtures";

test.describe("ダンジョン一覧", () => {
  test("一覧ページが表示される", async ({ page }) => {
    await page.goto("/dungeons");

    // ページタイトルの確認
    await expect(
      page.getByRole("heading", { name: "ダンジョン" }),
    ).toBeVisible();
  });

  test("シードダンジョンが表示される", async ({ page }) => {
    await page.goto("/dungeons");

    // 各ダンジョンのカードが表示されることを確認
    for (const dungeon of Object.values(SEED_DUNGEONS)) {
      await expect(
        page.getByRole("link", { name: dungeon.name }),
      ).toBeVisible();
    }
  });

  test("ダンジョンカードに異名が表示される", async ({ page }) => {
    await page.goto("/dungeons");

    // 忘却の聖堂の異名が表示されることを確認
    await expect(page.getByText(SEED_DUNGEONS.cathedral.alias)).toBeVisible();
  });
});

test.describe("ダンジョン詳細", () => {
  test("詳細ページに遷移できる", async ({ page }) => {
    await page.goto("/dungeons");

    // ダンジョンカードが表示されるまで待機
    await page
      .getByRole("link", { name: SEED_DUNGEONS.cathedral.name })
      .waitFor();

    // 忘却の聖堂のカードをクリック
    await page
      .getByRole("link", { name: SEED_DUNGEONS.cathedral.name })
      .click();

    // URLが変わることを確認
    await expect(page).toHaveURL(`/dungeons/${SEED_DUNGEONS.cathedral.id}`);
  });

  test("ダンジョン詳細が表示される", async ({ page }) => {
    await page.goto(`/dungeons/${SEED_DUNGEONS.cathedral.id}`);

    // 名前と異名が表示される
    await expect(
      page.getByRole("heading", { name: SEED_DUNGEONS.cathedral.name }),
    ).toBeVisible();
    await expect(page.getByText(SEED_DUNGEONS.cathedral.alias)).toBeVisible();
  });

  test("階層情報が表示される", async ({ page }) => {
    await page.goto(`/dungeons/${SEED_DUNGEONS.cathedral.id}`);

    // 階層数が表示される（「3層 / 2〜4人」の形式で表示）
    await expect(page.getByText("3層 / 2〜4人")).toBeVisible();
  });

  test("伝承情報が表示される", async ({ page }) => {
    await page.goto(`/dungeons/${SEED_DUNGEONS.cathedral.id}`);

    // 忘却の聖堂の伝承の一部が表示されることを確認
    await expect(page.getByText(/癒しの聖者を祀る聖堂/)).toBeVisible();
  });

  test("存在しないIDでエラーが表示される", async ({ page }) => {
    await page.goto("/dungeons/00000000-0000-0000-0000-000000000000");

    // エラーメッセージが表示される
    await expect(page.getByText("ダンジョンが見つかりません")).toBeVisible();
  });

  test("一覧に戻るリンクがある", async ({ page }) => {
    await page.goto(`/dungeons/${SEED_DUNGEONS.cathedral.id}`);

    // 一覧に戻るリンクを確認
    const backLink = page.getByRole("link", { name: /ダンジョン一覧に戻る/ });
    await expect(backLink).toBeVisible();

    // クリックして一覧に戻る
    await backLink.click();
    await expect(page).toHaveURL("/dungeons");
  });
});
