# タスク: ダッシュボードにキャラクター削除UI追加

## 概要

マイページ（ダッシュボード）からキャラクターを削除できるUIを追加する。

## 背景

- ユーザーが不要なキャラクターを削除する手段がない
- E2Eテストで空状態をテストするためにtRPC直接呼び出しが必要な状態
- バックエンドの `character.delete` mutation は既に実装済み

## 要件

### 機能要件

- [ ] キャラクターカードに削除ボタンを追加
  - [ ] ホバー時またはメニューから表示
  - [ ] 確認ダイアログを表示
  - [ ] 削除後、一覧を更新

### UI要件

- [ ] 削除ボタンはゴミ箱アイコンまたは「削除」テキスト
- [ ] 確認ダイアログで誤操作を防止
- [ ] 削除中のローディング表示

## 設計

### 影響範囲

| パッケージ | ファイル | 変更内容 |
| ---------- | -------- | -------- |
| `web` | `src/routes/dashboard.tsx` | 削除ボタン・確認ダイアログ追加 |
| `web` | `e2e/dashboard.spec.ts` | UI経由での削除に変更 |

### API

既存の `character.delete` mutation を使用:

```typescript
trpc.character.delete.mutate({ id: characterId })
```

## 実装手順

1. [ ] キャラクターカードに削除ボタン追加
2. [ ] 確認ダイアログ実装
3. [ ] 削除mutation呼び出し・キャッシュ更新
4. [ ] E2Eテスト更新（tRPC直接呼び出し → UI操作に変更）
5. [ ] `pnpm lint -- --fix && pnpm typecheck`
6. [ ] E2Eテスト実行

## 完了条件

- [ ] ダッシュボードからキャラクターを削除できる
- [ ] 確認ダイアログが表示される
- [ ] E2Eテストがtpc直接呼び出しではなくUI操作を使用
- [ ] lint/typecheck パス
- [ ] E2Eテスト パス

## 技術的負債

### 現状の問題

`e2e/dashboard.spec.ts` の「空状態テスト」で、以下のようなtRPC直接呼び出しを使用している:

```typescript
await page.evaluate(async () => {
  const { trpcClient } = await import("/src/lib/trpc.ts");
  const characters = await trpcClient.character.listMine.query();
  for (const char of characters) {
    await trpcClient.character.delete.mutate({ id: char.id });
  }
});
```

### 改善後

UI経由での削除に変更:

```typescript
// 各キャラクターの削除ボタンをクリック
const deleteButtons = page.getByRole("button", { name: "削除" });
while ((await deleteButtons.count()) > 0) {
  await deleteButtons.first().click();
  await page.getByRole("button", { name: "確認" }).click();
}
```

---

**作成日:** 2026-01-04
**ステータス:** Ready
**依存:** feature-dashboard-page.md (完了)
