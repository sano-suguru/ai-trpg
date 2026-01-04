/**
 * キャラクター機能のE2Eテスト
 *
 * 前提: シードデータが投入されていること
 * - 5件のサンプルキャラクター（灰村のセド、リラ、灰色のヴォルク、朽ちゆく月のエレナ、名なし）
 */

import { expect, test } from "@playwright/test";
import { SEED_CHARACTERS } from "@ai-trpg/shared/fixtures";

test.describe("キャラクター一覧", () => {
  test("一覧ページが表示される", async ({ page }) => {
    await page.goto("/characters");

    // ページタイトルの確認
    await expect(
      page.getByRole("heading", { name: "キャラクター" }),
    ).toBeVisible();
  });

  test("シードキャラクターが表示される", async ({ page }) => {
    await page.goto("/characters");

    // 各キャラクターのカードが表示されることを確認
    for (const char of Object.values(SEED_CHARACTERS)) {
      await expect(page.getByRole("link", { name: char.name })).toBeVisible();
    }
  });

  test("キャラクターカードにタイトルが表示される", async ({ page }) => {
    await page.goto("/characters");

    // セドのタイトルが表示されることを確認
    await expect(page.getByText(SEED_CHARACTERS.sed.title)).toBeVisible();
  });
});

test.describe("キャラクター詳細", () => {
  test("詳細ページに遷移できる", async ({ page }) => {
    await page.goto("/characters");

    // セドのカードが表示されるまで待機
    await page.getByRole("link", { name: SEED_CHARACTERS.sed.name }).waitFor();

    // セドのカードをクリック
    await page.getByRole("link", { name: SEED_CHARACTERS.sed.name }).click();

    // URLが変わることを確認
    await expect(page).toHaveURL(`/characters/${SEED_CHARACTERS.sed.id}`);
  });

  test("キャラクター詳細が表示される", async ({ page }) => {
    await page.goto(`/characters/${SEED_CHARACTERS.sed.id}`);

    // 名前とタイトルが表示される
    await expect(
      page.getByRole("heading", { name: SEED_CHARACTERS.sed.name }),
    ).toBeVisible();
    await expect(page.getByText(SEED_CHARACTERS.sed.title)).toBeVisible();
  });

  test("過去情報が表示される", async ({ page }) => {
    await page.goto(`/characters/${SEED_CHARACTERS.sed.id}`);

    // セドの過去が表示されることを確認
    await expect(page.getByText("灰燼の街の生き残り")).toBeVisible(); // origin
    await expect(page.getByText("愛した人を自らの手で葬った")).toBeVisible(); // loss
    await expect(page.getByText("焼け焦げた指先")).toBeVisible(); // mark
  });

  test("存在しないIDでエラーが表示される", async ({ page }) => {
    await page.goto("/characters/00000000-0000-0000-0000-000000000000");

    // エラーメッセージが表示される
    await expect(page.getByText("キャラクターが見つかりません")).toBeVisible();
  });

  test("一覧に戻るリンクがある", async ({ page }) => {
    await page.goto(`/characters/${SEED_CHARACTERS.sed.id}`);

    // 一覧に戻るリンクを確認
    const backLink = page.getByRole("link", { name: /キャラクター一覧に戻る/ });
    await expect(backLink).toBeVisible();

    // クリックして一覧に戻る
    await backLink.click();
    await expect(page).toHaveURL("/characters");
  });
});
