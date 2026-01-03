/**
 * キャラクター作成ウィザードのE2Eテスト
 *
 * 認証戦略:
 * - Worker fixture で各ワーカーごとに1回だけログイン
 * - storageState を保存して同一ワーカー内で再利用
 * - parallelIndex でユニークなメールアドレスを生成し競合を回避
 */

import {
  test as baseTest,
  expect,
  type Page,
  type Browser,
} from "@playwright/test";
import fs from "fs";
import path from "path";

// ========================================
// Worker Fixture で認証を1回だけ実行
// ========================================

export const test = baseTest.extend<object, { workerStorageState: string }>({
  // 全テストで同じ storageState を使用
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Worker ごとに1回だけ認証
  workerStorageState: [
    async ({ browser }, use, testInfo) => {
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

      // 認証をリトライ付きで実行（並列実行時のMailpit競合対策）
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          // リトライ時はワーカーごとに異なるディレイを追加
          if (attempt > 0) {
            await page.waitForTimeout(id * 2000 + attempt * 3000);
          }

          await authenticateWithMagicLink(browser, page, id, attempt);

          // storageState を保存
          await context.storageState({ path: fileName });
          await context.close();
          await use(fileName);
          return;
        } catch (error) {
          lastError = error as Error;
          await context.close();
          // リトライ前に少し待機
          if (attempt < maxRetries - 1) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }

      throw lastError ?? new Error("Authentication failed after retries");
    },
    { scope: "worker", timeout: 120000 },
  ],
});

/**
 * Magic Link でログイン（Worker fixture から呼ばれる）
 */
async function authenticateWithMagicLink(
  browser: Browser,
  page: Page,
  workerId: number,
  attempt: number = 0,
) {
  // Worker fixture のページは baseURL が設定されていないため絶対URLを使用
  const baseURL = "http://localhost:5173";
  await page.goto(`${baseURL}/login`);

  // Worker ごと・リトライごとにユニークなメールアドレス
  const email = `test-worker${workerId}-attempt${attempt}-${Date.now()}@example.com`;
  await page.getByRole("textbox", { name: "メールアドレス" }).fill(email);
  await page.getByRole("button", { name: "Magic Linkを送信" }).click();

  await expect(page.getByText("メールを送信しました")).toBeVisible();

  // Mailpit でメール取得（リトライ付き）
  // 別コンテキストを使用（認証 cookie を共有しない）
  const mailpitContext = await browser.newContext();
  const mailpitPage = await mailpitContext.newPage();
  let href: string | null = null;

  try {
    // メール配信には時間がかかることがあるので、十分なリトライ回数を設定
    for (let attempt = 0; attempt < 30; attempt++) {
      await mailpitPage.goto("http://127.0.0.1:54324");

      // このワーカーのメールアドレス宛のメールだけを検索
      const emailLink = mailpitPage.getByRole("link", {
        name: new RegExp(`To: ${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      });

      if (await emailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailLink.click();

        const previewFrame = mailpitPage
          .locator("#preview-html")
          .contentFrame();
        await previewFrame
          .getByRole("link", { name: "Log In" })
          .waitFor({ timeout: 10000 });
        href = await previewFrame
          .getByRole("link", { name: "Log In" })
          .getAttribute("href");

        if (href) break;
      }

      await mailpitPage.waitForTimeout(1000);
    }
  } finally {
    await mailpitContext.close();
  }

  if (!href) {
    throw new Error(`Login link not found for ${email} after 30 attempts`);
  }

  // ログインリンクを開く
  await page.goto(href);
  await page.waitForURL(`${baseURL}/#`, { timeout: 15000 });
  await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 断片を選択（出自・喪失・刻印）
 *
 * UIはアコーディオン形式:
 * - 未選択のカテゴリは最初から展開されている
 * - 選択するとアコーディオンが閉じる
 * - 閉じたアコーディオンはヘッダーをクリックで開く
 *
 * 注意: データはAPIから非同期で読み込まれるため、
 *       選択肢が表示されるまで待機する必要がある
 */
async function selectRequiredFragments(page: Page): Promise<void> {
  // データ読み込み完了を待つ（「読み込み中...」が消えるまで）
  await expect(page.getByText("読み込み中...").first()).not.toBeVisible({
    timeout: 30000,
  });

  // 出自: データ読み込み完了を待ってから選択
  const originButton = page.getByRole("button", {
    name: /灰燼の街の生き残り.*大火で滅んだ/,
  });
  await originButton.waitFor({ state: "visible", timeout: 15000 });
  await originButton.click();

  // 喪失: データ読み込み完了を待ってから選択
  const lossButton = page.getByRole("button", {
    name: /故郷はもう地図にない.*帰る場所そのものが/,
  });
  await lossButton.waitFor({ state: "visible", timeout: 15000 });
  await lossButton.click();

  // 刻印: データ読み込み完了を待ってから選択
  const markButton = page.getByRole("button", {
    name: /白髪（若くして）.*何かを見た/,
  });
  await markButton.waitFor({ state: "visible", timeout: 15000 });
  await markButton.click();
}

/**
 * 行動指針を選択（4つ全て）
 *
 * UIはアコーディオン形式:
 * - 未選択のカテゴリは最初から展開
 * - 選択すると閉じる
 * - 次のカテゴリを選ぶにはヘッダーをクリックして展開
 */
async function selectAllDirectives(page: Page): Promise<void> {
  // 1. 危険を前にしたとき: 最初から展開されている
  const dangerOption = page.getByRole("button", {
    name: /迷わず前に出る.*危険を恐れず/,
  });
  await dangerOption.waitFor({ state: "visible", timeout: 10000 });
  await dangerOption.click();

  // 2. 仲間が窮地に陥ったとき: 未選択なので展開されている
  const allyOption = page.getByRole("button", {
    name: /何を犠牲にしても助ける.*自分の命を懸けて/,
  });
  await allyOption.waitFor({ state: "visible", timeout: 10000 });
  await allyOption.click();

  // 3. 道徳的選択を迫られたとき: 未選択なので展開されている
  const moralOption = page.getByRole("button", {
    name: /正しいと信じる道を選ぶ.*己の信念に従い/,
  });
  await moralOption.waitFor({ state: "visible", timeout: 10000 });
  await moralOption.click();

  // 4. 未知のものに遭遇したとき: 未選択なので展開されている
  const unknownOption = page.getByRole("button", {
    name: /好奇心が恐怖に勝つ.*知りたいという欲求/,
  });
  await unknownOption.waitFor({ state: "visible", timeout: 10000 });
  await unknownOption.click();
}

// ========================================
// テスト
// ========================================

// 認証チェックは storageState を使わない
baseTest.describe("認証チェック", () => {
  baseTest(
    "未ログイン時はログインページにリダイレクトされる",
    async ({ page }) => {
      await page.goto("/characters/new");
      await expect(page).toHaveURL("/login");
    },
  );
});

// 認証が必要なテスト（Worker fixture で認証済み）
test.describe("キャラクター作成ウィザード", () => {
  test("断片選択画面が表示される", async ({ page }) => {
    await page.goto("/characters/new");
    await expect(
      page.getByRole("heading", { name: "断片を選ぶ" }),
    ).toBeVisible();
    await expect(page.getByText("出自・喪失・刻印は必須です")).toBeVisible();
  });

  test("必須断片が未選択だと次へ進めない", async ({ page }) => {
    await page.goto("/characters/new");

    const nextButton = page.getByRole("button", { name: "次へ：経歴を生成" });
    await expect(nextButton).toBeDisabled();

    // 出自のみ選択
    await page
      .getByRole("button", { name: /灰燼の街の生き残り.*大火で滅んだ/ })
      .click();

    // まだ無効
    await expect(nextButton).toBeDisabled();
  });

  test("キャラクター作成の全フローを実行できる", async ({ page }) => {
    await page.goto("/characters/new");
    await expect(
      page.getByRole("heading", { name: "断片を選ぶ" }),
    ).toBeVisible();

    // Step 1: 断片選択
    await selectRequiredFragments(page);
    await page.getByRole("button", { name: "次へ：経歴を生成" }).click();

    // Step 2: 経歴生成
    await expect(
      page.getByRole("heading", { name: "経歴を生成" }),
    ).toBeVisible();
    await expect(page.getByText("出自: 灰燼の街の生き残り")).toBeVisible();
    await page
      .getByRole("textbox", { name: "経歴" })
      .fill(
        "灰燼の街で生まれ、大火災ですべてを失った。白髪は炎の中で見た恐怖の証。",
      );
    await page.getByRole("button", { name: "次へ：名前と行動指針" }).click();

    // Step 3: 名前・行動指針
    await expect(
      page.getByRole("heading", { name: "名前と行動指針" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "二つ名/通り名（任意）" })
      .fill("灰燼");
    await page.getByRole("textbox", { name: "名前*" }).fill("テストセド");
    await selectAllDirectives(page);
    await page.getByRole("button", { name: "次へ：確認" }).click();

    // Step 4: 確認
    await expect(page.getByRole("heading", { name: "確認" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "テストセド" }),
    ).toBeVisible();
    // タイトル「灰燼の」が表示されていることを確認（exactマッチで重複回避）
    await expect(page.getByText("灰燼の", { exact: true })).toBeVisible();
    await expect(page.getByText("灰燼の街の生き残り")).toBeVisible();

    // キャラクター作成
    await page.getByRole("button", { name: "キャラクターを作成" }).click();

    // リダイレクト確認（URLにUUIDが含まれる）
    await expect(page).toHaveURL(
      /\/characters\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );

    // 詳細ページでキャラクター情報が表示されることを確認（getMine APIが正常動作）
    await expect(page.getByRole("heading", { name: "テストセド" })).toBeVisible(
      {
        timeout: 10000,
      },
    );
    // 断片情報が表示されていることを確認
    await expect(page.getByText("灰燼の街の生き残り")).toBeVisible();
    // 経歴が表示されていることを確認
    await expect(page.getByText("灰燼の街で生まれ")).toBeVisible();
  });

  test("戻るボタンで前のステップに戻れる", async ({ page }) => {
    await page.goto("/characters/new");

    // 断片選択して次へ
    await selectRequiredFragments(page);
    await page.getByRole("button", { name: "次へ：経歴を生成" }).click();
    await expect(
      page.getByRole("heading", { name: "経歴を生成" }),
    ).toBeVisible();

    // 戻る
    await page.getByRole("button", { name: "戻る" }).click();
    await expect(
      page.getByRole("heading", { name: "断片を選ぶ" }),
    ).toBeVisible();

    // 選択した断片が保持されていることを確認
    await expect(
      page.getByRole("button", { name: /出自.*灰燼の街の生き残り/ }),
    ).toBeVisible();
  });

  test("リセットボタンで最初からやり直せる", async ({ page }) => {
    await page.goto("/characters/new");

    // 断片選択
    await selectRequiredFragments(page);

    // リセット前に次へボタンが有効であることを確認
    const nextButton = page.getByRole("button", { name: "次へ：経歴を生成" });
    await expect(nextButton).toBeEnabled();

    // confirm ダイアログを自動的に accept
    page.on("dialog", (dialog) => dialog.accept());

    // リセット
    await page.getByRole("button", { name: "最初からやり直す" }).click();

    // 次へボタンが無効に戻っていることを確認
    await expect(nextButton).toBeDisabled({ timeout: 5000 });
  });

  test("LLM経歴生成が動作する", async ({ page }) => {
    await page.goto("/characters/new");

    // 断片選択して次へ
    await selectRequiredFragments(page);
    await page.getByRole("button", { name: "次へ：経歴を生成" }).click();

    // 経歴生成画面に遷移
    await expect(
      page.getByRole("heading", { name: "経歴を生成" }),
    ).toBeVisible();

    // 自動生成が開始されることを確認（ローディング表示）
    // 注意: 生成が速すぎると見えない場合があるため、テキストエリアまたはローディングを待つ
    const biographyTextarea = page.getByRole("textbox", { name: "経歴" });
    await biographyTextarea.waitFor({ state: "visible", timeout: 15000 });

    // モックLLMのレスポンスが表示されることを確認
    // mock.ts の MOCK_RESPONSES.biography の一部を検証
    await expect(biographyTextarea).toHaveValue(/灰の時代に生まれ/, {
      timeout: 15000,
    });
    await expect(biographyTextarea).toHaveValue(/故郷が一夜にして炎に包まれる/);
  });

  test("LLM名前候補生成が動作する", async ({ page }) => {
    await page.goto("/characters/new");

    // 断片選択 → 経歴生成
    await selectRequiredFragments(page);
    await page.getByRole("button", { name: "次へ：経歴を生成" }).click();

    // 経歴生成完了を待つ
    const biographyTextarea = page.getByRole("textbox", { name: "経歴" });
    await biographyTextarea.waitFor({ state: "visible", timeout: 15000 });
    await expect(biographyTextarea).toHaveValue(/灰の時代に生まれ/, {
      timeout: 15000,
    });

    // 次へ進む
    await page.getByRole("button", { name: "次へ：名前と行動指針" }).click();

    // 名前・行動指針画面に遷移
    await expect(
      page.getByRole("heading", { name: "名前と行動指針" }),
    ).toBeVisible();

    // 名前候補の生成完了を待つ（モックLLMのレスポンスがパースされてボタン表示）
    // mock.ts の MOCK_RESPONSES.names: "1. 灰燼のセド\n2. 忘却のリラ\n3. 灰色のヴォルク"
    // フロントエンドで「タイトルの名前」形式にパースされ、「タイトルの + 名前」と表示される
    const sedButton = page.getByRole("button", { name: /灰燼.*セド/ });
    await sedButton.waitFor({ state: "visible", timeout: 15000 });

    // 他の候補も表示されることを確認
    await expect(
      page.getByRole("button", { name: /忘却.*リラ/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /灰色.*ヴォルク/ }),
    ).toBeVisible();

    // 候補をクリックして名前入力欄に入力されることを確認
    await sedButton.click();
    await expect(page.getByRole("textbox", { name: "名前*" })).toHaveValue(
      "セド",
    );
    // タイトル入力欄も確認
    await expect(
      page.getByRole("textbox", { name: "二つ名/通り名（任意）" }),
    ).toHaveValue("灰燼");
  });
});
