/**
 * E2Eテスト用 Service Role 認証ヘルパー
 *
 * Supabase Admin API を使用してテストユーザーを作成し、
 * セッションを直接取得する。Mailpit 経由の Magic Link 認証を置き換え、
 * テストの安定性を向上させる。
 */

import { createClient } from "@supabase/supabase-js";

// ========================================
// 環境設定（環境変数優先、ローカルデフォルトにフォールバック）
// ========================================

// Supabase URL（CI環境変数またはローカルデフォルト）
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  "http://127.0.0.1:54321";

// Service Role Key（CI環境変数またはローカルデフォルト）
// Note: これは supabase start のデフォルト値で、公開されている開発用キー
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Anon Key（CI環境変数またはローカルデフォルト）
// Note: これは supabase start のデフォルト値で、公開されている開発用キー
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// テストユーザーの固定パスワード（ローカルテスト専用）
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
 * テストユーザーを作成（Admin API使用）
 *
 * ユーザーが存在しない場合のみ作成する。
 * セッション取得はブラウザ内で行うため、ここでは作成のみ。
 *
 * @param workerId - Playwright の parallelIndex（ワーカーごとにユニーク）
 */
export async function createTestUser(workerId: number): Promise<void> {
  const email = `e2e-worker${workerId}@test.local`;
  const adminClient = createAdminClient();

  // ユーザーが存在するか確認し、なければ作成
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
}

/** Web アプリの URL（エクスポート用） */
export const WEB_APP_URL = WEB_APP_ORIGIN;

/**
 * ブラウザ内認証に必要な情報を取得
 *
 * Node.js側で環境変数を解決し、ブラウザに渡す
 */
export function getAuthConfig(workerId: number): {
  supabaseUrl: string;
  supabaseKey: string;
  email: string;
  password: string;
} {
  return {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
    email: `e2e-worker${workerId}@test.local`,
    password: TEST_PASSWORD,
  };
}

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
