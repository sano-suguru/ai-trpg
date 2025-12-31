# 品質チェック

lint、typecheck、テストを実行し、問題を報告する。

## 入力

$ARGUMENTS - チェック対象（`all`, `api`, `web`, `shared`, または特定のパス）

---

## 実行手順

### 1. lint チェック

```bash
# 全体
pnpm lint

# パッケージ指定
pnpm lint:api
pnpm lint:web
pnpm lint:shared
```

### 2. TypeScript 型チェック

```bash
# 全体
pnpm typecheck

# パッケージ指定
pnpm typecheck:api
pnpm typecheck:web
pnpm typecheck:shared
```

### 3. テスト実行（存在する場合）

```bash
pnpm test
```

### 4. 結果集計

全てのチェックを実行し、結果を集計する。

---

## 出力形式

```markdown
## 品質チェック結果

### サマリー

| チェック | 結果 | エラー | 警告 |
|----------|------|--------|------|
| lint | Pass/Fail | 0 | 0 |
| typecheck | Pass/Fail | 0 | 0 |
| test | Pass/Fail/Skip | - | - |

### エラー詳細

#### lint エラー
```
ファイル:行:列 エラーメッセージ
```

#### typecheck エラー
```
ファイル:行:列 エラーメッセージ
```

### 警告詳細

#### lint 警告
```
ファイル:行:列 警告メッセージ
```

### 推奨アクション

1. [ ] エラー修正: ...
2. [ ] 警告対応: ...
```

---

## 判定基準

| 結果 | 条件 |
|------|------|
| **Pass** | エラー0、警告0 |
| **Conditional Pass** | エラー0、警告あり（対応推奨） |
| **Fail** | エラーあり（マージ不可） |

**注意:** このプロジェクトでは警告もエラーとして扱う。
全ての警告を解消してからマージすること。
