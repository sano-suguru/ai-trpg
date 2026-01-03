/**
 * リクエストスコープのログコンテキスト
 *
 * AsyncLocalStorageを使用して、リクエスト全体で共有される
 * トレースID、ユーザーIDなどの横断的な属性を管理
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/
 */

import { AsyncLocalStorage } from "node:async_hooks";

// ========================================
// Types
// ========================================

/**
 * リクエストスコープで共有されるコンテキスト
 */
export interface RequestContext {
  /** リクエストを一意に識別するID */
  readonly requestId: string;
  /** 認証済みユーザーID（未認証の場合はundefined） */
  readonly userId?: string;
  /** リクエストパス */
  readonly path?: string;
  /** リクエストメソッド */
  readonly method?: string;
}

// ========================================
// Storage
// ========================================

/**
 * リクエストコンテキストを保持するAsyncLocalStorage
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

// ========================================
// Public API
// ========================================

/**
 * 現在のリクエストコンテキストを取得
 *
 * @returns 現在のコンテキスト、またはコンテキスト外の場合はundefined
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * リクエストコンテキストを設定して関数を実行
 *
 * @param context - 設定するコンテキスト
 * @param fn - コンテキスト内で実行する関数
 * @returns 関数の戻り値
 *
 * @example
 * ```typescript
 * await runWithContext(
 *   { requestId: crypto.randomUUID(), userId: "user-123", path: "/trpc/character.create" },
 *   async () => {
 *     // この中で呼ばれるすべてのログにrequestIdとuserIdが自動付与される
 *     await handleRequest();
 *   }
 * );
 * ```
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn);
}

/**
 * 現在のコンテキストを更新して関数を実行
 * 既存のコンテキストがない場合は新しいコンテキストを作成
 *
 * @param updates - 更新するフィールド
 * @param fn - コンテキスト内で実行する関数
 * @returns 関数の戻り値
 */
export function updateContext<T>(
  updates: Partial<RequestContext>,
  fn: () => T,
): T {
  const current = getRequestContext();
  const newContext: RequestContext = {
    requestId: current?.requestId ?? generateRequestId(),
    ...current,
    ...updates,
  };
  return requestContextStorage.run(newContext, fn);
}

/**
 * リクエストIDを生成
 * UUIDv4形式の短縮版（先頭8文字）を使用して可読性を向上
 */
export function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}
