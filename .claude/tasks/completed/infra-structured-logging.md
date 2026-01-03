# タスク: 構造化ログの基盤整備

## 概要

API層に構造化ログの基盤を整備し、`console.log` / `console.error` を構造化ログに置き換える。

## 背景

現在、LLMサービスを含む各所で `console.log` / `console.error` を使用してデバッグログを出力している。本番運用やデバッグの効率化のため、以下の課題を解決する必要がある：

- ログのフォーマットが不統一
- ログレベルの制御ができない
- 構造化されていないためパースが困難
- 本番環境でのデバッグログの無効化ができない

## 要件

### 機能要件

- [x] 構造化ログユーティリティの作成
- [x] ログレベルのサポート（debug, info, warn, error）
- [x] 環境変数によるログレベル制御
- [x] JSON形式での出力オプション
- [x] 既存の `console.log` / `console.error` を置き換え

### 非機能要件

- [x] パフォーマンス: ログ出力によるレイテンシ増加を最小限に
- [x] Cloudflare Workers環境での動作保証

## 設計

### 影響範囲

| パッケージ | ファイル            | 変更内容                        |
| ---------- | ------------------- | ------------------------------- |
| `api`      | `services/logger/`  | 新規ログユーティリティ作成      |
| `api`      | `services/llm/*.ts` | console.log → logger に置き換え |
| `api`      | `features/**/*.ts`  | 必要に応じてログ追加            |

### ログユーティリティ

```typescript
// 型定義の概要
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// ファクトリ関数
function createLogger(name: string): Logger;
```

### 出力形式

```json
{
  "level": "info",
  "timestamp": "2026-01-03T12:00:00.000Z",
  "name": "LLMService",
  "message": "Available providers",
  "context": {
    "providers": ["openrouter", "groq"]
  }
}
```

## 実装手順

1. [x] `api/services/logger/` にLoggerユーティリティ作成
2. [x] 環境変数 `LOG_LEVEL` のサポート追加
3. [x] LLMサービスの `console.log` / `console.error` を置き換え
4. [x] 他の箇所も必要に応じて置き換え

## テスト計画

- [x] 手動テスト: ログ出力が正しいフォーマットで行われることを確認
- [x] 手動テスト: LOG_LEVELによるフィルタリングが動作することを確認

## 完了条件

- [x] 全ての `console.log` / `console.error` が構造化ログに置き換えられている
- [x] `pnpm lint` がパス
- [x] `pnpm typecheck` がパス
- [x] 開発環境でログ出力が確認できる

## 参考

- 構造化ログの導入対象箇所:
  - `apps/api/src/services/llm/` - LLMサービス全般
  - `apps/api/src/features/` - Feature Slice全般

## 関連: LLMサービスのエラーログ追加

構造化ログ導入後、LLMサービスのフォールバック失敗時にエラー詳細をログに記録する。

### 現状

`apps/api/src/services/llm/service.ts` の `tryProvider` 関数内に2箇所のTODOコメントがある：

1. **全プロバイダー失敗時（114-119行目付近）**: 最後のエラー詳細をログに記録する
2. **個別プロバイダー失敗時（130-131行目付近）**: 各プロバイダーのエラー詳細をログに記録する

### 改善案

```typescript
const logger = createLogger("LLMService");

// 全プロバイダー失敗時
if (index >= availableProviders.length) {
  logger.error("All LLM providers failed", {
    attemptedProviders: availableProviders.map(p => p.name),
  });
  return errAsync(Errors.llm("none", "全てのプロバイダーで失敗しました"));
}

// 個別プロバイダー失敗時
.orElse((error) => {
  logger.warn("LLM provider failed, trying next", {
    provider: provider.name,
    errorType: error.type,
    // Note: エラーメッセージにAPIキー等が含まれる可能性があるため、
    // 本番環境では出力レベルを調整する
  });
  return tryProvider(index + 1);
});
```

### 追加タスク

- [x] `apps/api/src/services/llm/service.ts` のフォールバック失敗時ログ追加
- [x] 各プロバイダー失敗時の警告ログ追加

## 関連: E2Eテストのエラーハンドリング改善

構造化ログ導入後、E2Eテストでもロガーを使用してデバッグ情報を出力する。

### 背景

`apps/web/e2e/character-creation.spec.ts` の認証処理（47-56行目）で、エラー発生時のデバッグ情報が不足している。
現在は `no-console: "error"` ルールにより `console.log` / `console.error` が使用できないため、構造化ログ導入後に対応する。

### 対象箇所

```typescript
// apps/web/e2e/character-creation.spec.ts:49-56
try {
  await authenticateWithMagicLink(browser, page, id);
  await context.storageState({ path: fileName });
} finally {
  await context.close();
}
```

### 改善案

```typescript
import { createLogger } from "..."; // or test-specific logger

const logger = createLogger("E2E:Auth");

try {
  await authenticateWithMagicLink(browser, page, id);
  await context.storageState({ path: fileName });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("Worker authentication failed", {
    workerId: id,
    error: message,
  });
  throw new Error(`Worker ${id} authentication failed: ${message}`);
} finally {
  await context.close();
}
```

### 追加タスク

- [ ] E2Eテスト用のロガー設計（Playwright環境での動作確認）
- [ ] `apps/web/e2e/character-creation.spec.ts` のエラーハンドリング改善

---

**作成日:** 2026-01-03
**完了日:** 2026-01-03
**担当:** Claude
**ステータス:** Completed
