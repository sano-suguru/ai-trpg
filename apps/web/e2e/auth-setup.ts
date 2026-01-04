/**
 * E2Eテスト用 Service Role 認証ヘルパー
 *
 * Supabase Admin API を使用してテストユーザーを作成し、
 * セッションを直接取得する。Mailpit 経由の Magic Link 認証を置き換え、
 * テストの安定性を向上させる。
 */

import { createClient, type Session } from "@supabase/supabase-js";

// ローカル Supabase の設定（supabase start のデフォルト値）
const SUPABASE_URL = "http://127.0.0.1:54321";
// Service Role Key（supabase start で生成されるデフォルト値）
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// テストユーザーの固定パスワード
const TEST_PASSWORD = "e2e-test-password-12345";

// Web アプリの URL
const WEB_APP_ORIGIN = "http://localhost:5173";

/**
 * Admin クライアントを作成（Service Role Key を使用）
 */
function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 通常のクライアントを作成（Anon Key を使用）
 */
function createAnonClient() {
  // ローカル Supabase の Anon Key
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * テストユーザーを作成またはセッションを取得
 *
 * @param workerId - Playwright の parallelIndex（ワーカーごとにユニーク）
 * @returns セッション情報
 */
export async function createTestSession(workerId: number): Promise<Session> {
  const email = `e2e-worker${workerId}@test.local`;
  const adminClient = createAdminClient();

  // 1. ユーザーが存在するか確認し、なければ作成
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((u) => u.email === email);

  if (!existingUser) {
    // 新規ユーザー作成
    const { error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true, // メール確認済みとしてマーク
    });

    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
  }

  // 2. signInWithPassword でセッションを取得
  const anonClient = createAnonClient();
  const { data, error: signInError } = await anonClient.auth.signInWithPassword(
    {
      email,
      password: TEST_PASSWORD,
    },
  );

  if (signInError || !data.session) {
    throw new Error(
      `Failed to sign in test user: ${signInError?.message ?? "No session returned"}`,
    );
  }

  return data.session;
}

/**
 * セッションデータを取得（localStorage に注入する形式）
 *
 * @param session - Supabase のセッション
 * @returns localStorage に保存するセッションデータ
 */
export function getSessionData(session: Session): {
  storageKey: string;
  sessionData: object;
} {
  // Supabase の localStorage キー形式: sb-{host}-auth-token
  // 127.0.0.1 の場合: sb-127.0.0.1-auth-token
  const storageKey = "sb-127.0.0.1-auth-token";

  // localStorage に注入するデータ形式
  const sessionData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user,
  };

  return { storageKey, sessionData };
}

/** Web アプリの URL（エクスポート用） */
export const WEB_APP_URL = WEB_APP_ORIGIN;

/**
 * テストユーザーを削除（クリーンアップ用）
 *
 * @param workerId - Playwright の parallelIndex
 */
export async function deleteTestUser(workerId: number): Promise<void> {
  const email = `e2e-worker${workerId}@test.local`;
  const adminClient = createAdminClient();

  const { data: users } = await adminClient.auth.admin.listUsers();
  const user = users?.users.find((u) => u.email === email);

  if (user) {
    await adminClient.auth.admin.deleteUser(user.id);
  }
}
