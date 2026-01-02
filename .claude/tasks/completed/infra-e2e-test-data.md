# タスク: E2Eテストデータ基盤の整備

## 概要

シードデータ依存から脱却し、API経由でテストデータを動的に生成するE2Eテスト基盤を構築する。

## 背景

現在のE2Eテストはシードデータ（固定UUID）に依存している。この方式には以下の問題がある：

1. **脆弱性**: シードデータが変更されるとテストが壊れる
2. **独立性の欠如**: テスト間でデータが共有され、順序依存が発生しうる
3. **拡張性の制限**: 新しいテストシナリオを追加する際にシードデータの変更が必要

キャラクター作成UIが実装された後、適切なテストデータ管理基盤を整備する。

## 前提条件

- [ ] キャラクター作成UI（feature-character-create）が完了していること
- [ ] 認証機能が実装されていること

## 要件

### 機能要件

- [ ] テストユーザーでログインする仕組み
- [ ] テスト用キャラクターをAPI経由で作成する仕組み
- [ ] テスト終了後のデータクリーンアップ（任意）

### 非機能要件

- [ ] テストの独立性: 各テストは他のテストに依存しない
- [ ] 実行速度: テストデータ作成は最小限に抑える
- [ ] CI対応: GitHub Actions で安定動作

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
|-----------|----------|----------|
| `web` | `e2e/fixtures/` | テストフィクスチャ追加 |
| `web` | `e2e/*.spec.ts` | 既存テストをリファクタ |
| `web` | `playwright.config.ts` | 必要に応じて設定調整 |

### テストフィクスチャ設計

```typescript
// e2e/fixtures/auth.ts
import { test as base } from "@playwright/test";

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // テストユーザーでログイン
    await page.goto("/login");
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    await use(page);
  },
});
```

```typescript
// e2e/fixtures/character.ts
export const test = base.extend<{
  testCharacter: Character;
}>({
  testCharacter: async ({ authenticatedPage }, use) => {
    // APIまたはUI経由でキャラクター作成
    const character = await createTestCharacter(authenticatedPage);

    await use(character);

    // クリーンアップ（任意）
    // await deleteTestCharacter(character.id);
  },
});
```

### アプローチの選択肢

1. **UI経由でデータ作成**
   - Pros: 実際のユーザーフローをテスト
   - Cons: 遅い、UIの変更に影響を受ける

2. **API経由でデータ作成（推奨）**
   - Pros: 高速、安定
   - Cons: APIのテストにはならない

3. **データベース直接操作**
   - Pros: 最速
   - Cons: バイパスが多すぎる、本番との乖離

**推奨**: API経由でテストデータを作成し、UIテストに集中する。

## 実装手順

1. [ ] テストユーザー認証フィクスチャ作成
2. [ ] キャラクター作成ヘルパー関数作成
3. [ ] 既存テスト（characters.spec.ts）をリファクタ
4. [ ] ダンジョンテスト（dungeons.spec.ts）をリファクタ
5. [ ] CIでの動作確認

## テスト計画

- [ ] フィクスチャのユニットテスト（なし - E2E自体がテスト）
- [ ] CIでの全テスト実行

## 完了条件

- [ ] シードデータのハードコードIDが削除されている
- [ ] 各テストが独立して実行可能
- [ ] `pnpm --filter @ai-trpg/web e2e` がCIで安定動作
- [ ] README.mdにテストデータ管理方針を記載

## 参考

- [Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [現在のE2Eテスト](../../apps/web/e2e/)

---

**作成日:** 2026-01-01
**完了日:** 2026-01-02
**担当:**
**ステータス:** Completed

## 完了メモ

当初計画していたAPI経由のテストデータ生成は、キャラクター作成UI実装後に改めて検討する。
現時点ではシードデータ前提のE2Eテストを作成し、以下を達成：

- シードデータ前提のE2Eテスト18件作成（characters.spec.ts, dungeons.spec.ts）
- `networkidle`から要素待機方式への変更でFlakyテスト解消
- 並列実行（4ワーカー）で安定動作確認
- CI設定（workers: 2, retries: 2）で本番運用可能
