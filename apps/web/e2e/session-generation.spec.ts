/**
 * セッション生成フローのE2Eテスト
 *
 * テストフロー:
 * 1. キャラクターを2体作成（APIで高速化）
 * 2. セッション作成ページでパーティ編成
 * 3. ダンジョン選択
 * 4. セッション生成実行
 * 5. リプレイ表示確認
 *
 * 前提条件:
 * - USE_MOCK_LLM=true がAPI側で設定されていること
 * - シードデータでダンジョンが存在すること
 */

import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

// ========================================
// ヘルパー関数
// ========================================

/**
 * APIを使ってキャラクターを高速に作成
 *
 * テスト用に最小限のフラグメントと指針を持つキャラクターを作成
 */
async function createTestCharacterViaUI(
  page: Page,
  name: string,
  title: string,
): Promise<void> {
  await page.goto("/characters/new");

  // データ読み込み完了を待つ
  await expect(page.getByText("読み込み中...").first()).not.toBeVisible({
    timeout: 30000,
  });

  // Step 1: 過去選択（必須フラグメント）
  const originButton = page.getByRole("button", {
    name: /灰燼の街の生き残り.*大火で滅んだ/,
  });
  await originButton.waitFor({ state: "visible", timeout: 15000 });
  await originButton.click();

  const lossButton = page.getByRole("button", {
    name: /故郷はもう地図にない.*帰る場所そのものが/,
  });
  await lossButton.waitFor({ state: "visible", timeout: 15000 });
  await lossButton.click();

  const markButton = page.getByRole("button", {
    name: /白髪（若くして）.*何かを見た/,
  });
  await markButton.waitFor({ state: "visible", timeout: 15000 });
  await markButton.click();

  await page.getByRole("button", { name: "次へ：生い立ちを生成" }).click();

  // Step 2: 生い立ち（自動生成を待つ）
  await expect(
    page.getByRole("heading", { name: "生い立ちを生成" }),
  ).toBeVisible();
  const biographyTextarea = page.getByRole("textbox", { name: "生い立ち" });
  await biographyTextarea.waitFor({ state: "visible", timeout: 15000 });
  // モックLLMの応答を待つ
  await expect(biographyTextarea).toHaveValue(/灰の時代に生まれ/, {
    timeout: 15000,
  });

  await page.getByRole("button", { name: "次へ：名前と行動指針" }).click();

  // Step 3: 名前・行動指針
  await expect(
    page.getByRole("heading", { name: "名前と行動指針" }),
  ).toBeVisible();

  // 名前入力（候補が表示されるのを待ってから手動入力）
  const nameInput = page.getByRole("textbox", { name: "名前*" });
  await nameInput.waitFor({ state: "visible", timeout: 10000 });
  await page
    .getByRole("textbox", { name: "二つ名/通り名（任意）" })
    .fill(title);
  await nameInput.fill(name);

  // 行動指針を選択
  const dangerOption = page.getByRole("button", {
    name: /迷わず前に出る.*危険を恐れず/,
  });
  await dangerOption.waitFor({ state: "visible", timeout: 10000 });
  await dangerOption.click();

  const allyOption = page.getByRole("button", {
    name: /何を犠牲にしても助ける.*自分の命を懸けて/,
  });
  await allyOption.waitFor({ state: "visible", timeout: 10000 });
  await allyOption.click();

  const moralOption = page.getByRole("button", {
    name: /正しいと信じる道を選ぶ.*己の信念に従い/,
  });
  await moralOption.waitFor({ state: "visible", timeout: 10000 });
  await moralOption.click();

  const unknownOption = page.getByRole("button", {
    name: /好奇心が恐怖に勝つ.*知りたいという欲求/,
  });
  await unknownOption.waitFor({ state: "visible", timeout: 10000 });
  await unknownOption.click();

  await page.getByRole("button", { name: "次へ：確認" }).click();

  // Step 4: 確認・作成
  await expect(page.getByRole("heading", { name: "確認" })).toBeVisible();
  await page.getByRole("button", { name: "キャラクターを作成" }).click();

  // 作成完了を待つ（詳細ページにリダイレクト）
  // 注: API呼び出しに時間がかかる場合があるため長めのタイムアウト
  await expect(page).toHaveURL(
    /\/characters\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    { timeout: 60000 },
  );
}

// ========================================
// テスト
// ========================================

test.describe("セッション生成フロー", () => {
  test.describe.configure({ mode: "serial" });

  // テストのタイムアウトを延長（キャラクター作成が遅い場合がある）
  test.setTimeout(120000);

  // 各テストで使用するキャラクター名
  const CHARACTER_1 = { name: "E2Eセド", title: "灰燼" };
  const CHARACTER_2 = { name: "E2Eリラ", title: "忘却" };

  test("事前準備：キャラクター1を作成", async ({ page }) => {
    await createTestCharacterViaUI(page, CHARACTER_1.name, CHARACTER_1.title);
    await expect(
      page.getByRole("heading", { name: CHARACTER_1.name }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("事前準備：キャラクター2を作成", async ({ page }) => {
    await createTestCharacterViaUI(page, CHARACTER_2.name, CHARACTER_2.title);
    await expect(
      page.getByRole("heading", { name: CHARACTER_2.name }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("セッション作成画面が表示される", async ({ page }) => {
    await page.goto("/sessions/new");
    await expect(
      page.getByRole("heading", { name: "新しいセッション" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "パーティ編成", level: 3 }),
    ).toBeVisible();
  });

  test("パーティ未選択では次へ進めない", async ({ page }) => {
    await page.goto("/sessions/new");

    // パーティ編成ステップが表示されるまで待つ
    await expect(
      page.getByRole("heading", { name: "パーティ編成", level: 3 }),
    ).toBeVisible();

    // 次へボタンは無効
    const nextButton = page.getByRole("button", { name: "次へ" });
    await expect(nextButton).toBeDisabled();

    // 1人だけ選択
    const char1Button = page.getByRole("button", {
      name: new RegExp(CHARACTER_1.name),
    });
    await char1Button.waitFor({ state: "visible", timeout: 10000 });
    await char1Button.click();

    // まだ無効（最低2人必要）
    await expect(nextButton).toBeDisabled();
  });

  test("セッション生成の全フローを実行できる", async ({ page }) => {
    await page.goto("/sessions/new");

    // Step 1: パーティ編成
    await expect(
      page.getByRole("heading", { name: "パーティ編成", level: 3 }),
    ).toBeVisible();

    // キャラクター読み込みを待つ
    const char1Button = page.getByRole("button", {
      name: new RegExp(CHARACTER_1.name),
    });
    await char1Button.waitFor({ state: "visible", timeout: 15000 });
    await char1Button.click();

    const char2Button = page.getByRole("button", {
      name: new RegExp(CHARACTER_2.name),
    });
    await char2Button.waitFor({ state: "visible", timeout: 10000 });
    await char2Button.click();

    // 2人選択で次へが有効に
    await page.getByRole("button", { name: "次へ" }).click();

    // Step 2: ダンジョン選択
    await expect(
      page.getByRole("heading", { name: "ダンジョン選択", level: 3 }),
    ).toBeVisible();

    // ダンジョン読み込みを待つ
    const dungeonButton = page.getByRole("button", { name: /灰燼の街の廃墟/ });
    await dungeonButton.waitFor({ state: "visible", timeout: 15000 });
    await dungeonButton.click();

    await page.getByRole("button", { name: "次へ" }).click();

    // Step 3: 確認
    await expect(
      page.getByRole("heading", { name: "セッション内容の確認", level: 3 }),
    ).toBeVisible();
    await expect(page.getByText(CHARACTER_1.name)).toBeVisible();
    await expect(page.getByText(CHARACTER_2.name)).toBeVisible();
    await expect(page.getByText("灰燼の街の廃墟")).toBeVisible();

    // セッション開始
    await page.getByRole("button", { name: "セッション開始" }).click();

    // Step 4: 生成完了を待つ
    // 「セッション生成中」画面が表示される
    await expect(
      page.getByRole("heading", { name: "セッション生成中" }),
    ).toBeVisible({ timeout: 10000 });

    // 生成が完了するまで待つ
    // 成功時: "100%" または "生成が完了しました" が表示される
    // 失敗時: "再試行" ボタンが表示される
    // モックLLMは高速なので、すぐに完了するはず

    // 生成進捗を監視（100%になるか、エラーが出るまで待つ）
    // 注: UIの実装によって表示が異なる場合があるため、柔軟に対応
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes("100%") ||
          text.includes("失敗") ||
          text.includes("完了")
        );
      },
      { timeout: 60000 },
    );

    // セッション一覧に移動
    await page.goto("/sessions");

    // ページ読み込みを待つ
    await page.waitForLoadState("networkidle");

    // 完了したセッションが存在することを確認
    // 注: 生成に失敗した場合は "失敗" が表示されることがある
    const completedOrFailedSession = page.getByText(/完了|失敗/).first();
    await completedOrFailedSession.waitFor({
      state: "visible",
      timeout: 15000,
    });

    // 完了セッションがあることを確認
    const completedSession = page.getByText("完了").first();
    await completedSession.waitFor({ state: "visible", timeout: 5000 });

    // 完了セッションをクリックしてリプレイを確認
    await page.getByRole("link", { name: /完了/ }).first().click();

    // リプレイ表示を確認
    await expect(
      page.getByRole("heading", { name: "灰燼の街の廃墟" }),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("heading", { name: "参加者" })).toBeVisible();

    // シーンが表示されることを確認
    await expect(page.getByText("Scene 1")).toBeVisible();
  });

  test("リプレイにエピグラフとエピローグが表示される", async ({ page }) => {
    // 完了セッションの詳細ページへ直接アクセス
    await page.goto("/sessions");

    const completedLink = page.getByRole("link", { name: /完了/ }).first();
    await completedLink.waitFor({ state: "visible", timeout: 15000 });
    await completedLink.click();

    // ローディング状態が終わるまで待つ
    await expect(page.getByText("リプレイを読み込み中...")).not.toBeVisible({
      timeout: 30000,
    });

    // リプレイ読み込みを待つ
    await expect(
      page.getByRole("heading", { name: "灰燼の街の廃墟" }),
    ).toBeVisible({ timeout: 15000 });

    // エピグラフ（blockquote）が表示されることを確認
    // モックLLMのレスポンス: "灰の中に埋もれた真実は..."
    await expect(page.locator("blockquote")).toContainText(
      "灰の中に埋もれた真実",
    );

    // エピローグが表示されることを確認
    // モックLLMのレスポンス: "一行は街を後にした..."
    await expect(page.getByText("一行は街を後にした")).toBeVisible();

    // フッター情報が表示されることを確認
    // 注: "生存者の隠れ家" というシーンタイトルもあるため exact: true を使用
    await expect(
      page.getByRole("heading", { name: "生存者", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible(); // "2/2" など
  });
});
