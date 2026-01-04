# タスク: E2E認証をService Role方式に変更

## 概要

E2Eテストの認証をMailpit経由のMagic LinkからSupabase Service Role APIによるセッション直接注入に変更し、テストの安定性を向上させる。

## 背景

現在のE2Eテストは以下の問題を抱えている:
- Mailpit経由のMagic Link認証が不安定（フレーキーテスト）
- 複数ワーカー並列実行時に認証競合が発生
- メール配信→ポーリング→リンク抽出→ナビゲーションと多段階で失敗点が多い

Service Role APIを使用することで:
- メール送受信が不要になり即座にセッション取得可能
- 完全に決定論的な認証フロー
- 並列実行時も競合なし

## 要件

### 機能要件

- [x] Service Role APIでテストユーザー作成
- [x] セッショントークン直接生成
- [x] ブラウザのlocalStorageにセッション注入
- [x] 既存のWorker fixtureを置き換え

### 非機能要件

- [x] 全26テストが安定してパス
- [x] ワーカー設定の最適化（ローカル1、CI2）
- [x] CI環境でも動作

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
|------------|----------|----------|
| `web` | `e2e/auth-setup.ts` | 新規: Service Role認証ヘルパー |
| `web` | `e2e/character-creation.spec.ts` | Worker fixture書き換え |
| `web` | `playwright.config.ts` | ワーカー数を最適値に設定 |

### 実装方針

```typescript
// apps/web/e2e/auth-setup.ts
import { createClient } from "@supabase/supabase-js";

export async function createTestUser(workerId: number): Promise<void> {
  const adminClient = createAdminClient();
  const email = `e2e-worker${workerId}@test.local`;

  // ユーザーが存在しない場合のみ作成
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((u) => u.email === email);

  if (!existingUser) {
    await adminClient.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  }
}

// Worker fixtureでの使用: ブラウザ内でsignInWithPassword実行
await page.evaluate(async ({ email, password }) => {
  const { supabase } = await import("/src/lib/supabase.ts");
  await supabase.auth.signInWithPassword({ email, password });
}, { email, password });

// Playwright storageState で認証状態を保存
await context.storageState({ path: fileName });
```

## 実装手順

1. [x] Supabase Admin APIの動作確認
2. [x] `e2e/auth-setup.ts` 作成
3. [x] Worker fixtureをService Role方式に書き換え
4. [x] 全テストが安定して動作することを確認
5. [x] `playwright.config.ts` のワーカー数を最適値に設定
6. [x] 古いMailpit関連コードを削除

## テスト計画

- [x] 1ワーカーで全テスト成功
- [x] 安定した実行を確認（26 passed）

## 完了条件

- [x] Mailpit依存が完全に除去されている
- [x] `pnpm --filter @ai-trpg/web e2e` が安定動作
- [x] CI環境でも動作する設定

## 参考

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- 実装: `apps/web/e2e/auth-setup.ts`, `apps/web/e2e/character-creation.spec.ts`

---

**作成日:** 2026-01-04
**完了日:** 2026-01-04
**ステータス:** Done
