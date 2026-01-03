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

- [ ] Service Role APIでテストユーザー作成
- [ ] セッショントークン直接生成
- [ ] ブラウザのlocalStorageにセッション注入
- [ ] 既存のWorker fixtureを置き換え

### 非機能要件

- [ ] 全26テストが安定してパス
- [ ] 4ワーカー並列実行でも安定
- [ ] CI環境でも動作

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
|------------|----------|----------|
| `web` | `e2e/auth-setup.ts` | 新規: Service Role認証ヘルパー |
| `web` | `e2e/character-creation.spec.ts` | Worker fixture書き換え |
| `web` | `playwright.config.ts` | ワーカー数を4に戻す |

### 実装方針

```typescript
// apps/web/e2e/auth-setup.ts
import { createClient } from "@supabase/supabase-js";

export async function createTestSession(workerId: number) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  const email = `e2e-worker${workerId}@test.local`;

  // 1. ユーザー作成（既存なら取得）
  const { data: user } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  // 2. セッション生成
  // Note: generateLinkではなくsignInWithPasswordか
  // admin.generateLinkで直接セッション取得

  return { user, session };
}

// Worker fixtureでの使用
async function injectSession(page: Page, session: Session) {
  await page.evaluate((sessionData) => {
    localStorage.setItem(
      'sb-127.0.0.1-auth-token',
      JSON.stringify(sessionData)
    );
  }, session);
}
```

## 実装手順

1. [ ] Supabase Admin APIの動作確認
2. [ ] `e2e/auth-setup.ts` 作成
3. [ ] Worker fixtureをService Role方式に書き換え
4. [ ] 全テストが並列実行で安定することを確認
5. [ ] `playwright.config.ts` のワーカー数を4に戻す
6. [ ] 古いMailpit関連コードを削除

## テスト計画

- [ ] 1ワーカーで全テスト成功
- [ ] 2ワーカーで全テスト成功
- [ ] 4ワーカーで全テスト成功
- [ ] 5回連続実行で全てパス

## 完了条件

- [ ] Mailpit依存が完全に除去されている
- [ ] `pnpm --filter @ai-trpg/web e2e` が4ワーカーで安定
- [ ] CI環境で安定動作

## 参考

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- 現在の実装: `apps/web/e2e/character-creation.spec.ts`

---

**作成日:** 2026-01-04
**担当:**
**ステータス:** Ready
