# タスク: Database Security Enhancement

## 概要

本番環境向けのデータベースセキュリティ強化（多層防御の検討）

## 背景

現在のアーキテクチャ:
- バックエンドAPIが`postgres.js`で直接PostgreSQLに接続
- 認証・認可はtRPC `protectedProcedure`で担保
- RLSは未使用（直接接続ではバイパスされるため）

この設計は開発段階では問題ないが、本番運用時に多層防御（Defense in Depth）が必要になる可能性がある。

### 現状の接続フロー

```
Client → tRPC API (認証) → postgres.js → PostgreSQL
                ↑
          protectedProcedure
```

### テーブル一覧

| テーブル | アクセス元 | 認証 |
|---------|-----------|------|
| `characters` | API経由 | protectedProcedure |
| `dungeons` | API経由 | protectedProcedure |
| `llm_usage_logs` | API経由 | protectedProcedure |

## 検討事項

### Option 1: 現状維持

- tRPCレイヤーで認証・認可を担保
- シンプルで管理しやすい
- 単一障害点（APIが侵害されると全データにアクセス可能）

### Option 2: 専用DBユーザー + 最小権限

```sql
-- API専用ユーザーを作成
CREATE USER api_user WITH PASSWORD 'xxx';

-- テーブルごとに必要な権限のみ付与
GRANT SELECT, INSERT, UPDATE, DELETE ON characters TO api_user;
GRANT SELECT, INSERT ON llm_usage_logs TO api_user;
-- DELETEは不要なら付与しない
```

- 権限の最小化
- 誤操作・SQLインジェクションの被害を限定
- 管理コストが増加

### Option 3: RLS + service_role

```sql
-- RLSを有効化
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- service_roleは全アクセス可能
CREATE POLICY "Service role full access" ON characters
  FOR ALL USING (auth.role() = 'service_role');
```

- Supabaseの標準パターン
- ただし現在の接続方式（postgres.js直接）では効果なし
- Supabase Client経由に変更が必要

## 要件（将来）

### 機能要件

- [ ] 専用DBユーザーの作成
- [ ] テーブルごとの権限設定
- [ ] 接続文字列の環境変数分離

### 非機能要件

- [ ] 既存機能への影響がないこと
- [ ] ローカル開発環境でも動作すること

## 決定事項

- **現時点**: 対応不要（開発段階のため）
- **本番前**: Option 2（専用DBユーザー）を推奨
- **CLAUDE.md**: 現状のセキュリティモデルを明文化済み

## 参考

- [CLAUDE.md - Database Access & Security](../../CLAUDE.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**作成日:** 2025-01-03
**担当:** -
**ステータス:** Backlog

<!-- 本番デプロイ前に対応を検討 -->
