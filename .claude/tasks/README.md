# タスク仕様管理

このディレクトリには、実装タスクの仕様書を配置します。

## 目的

- タスクの仕様を一元管理し、Claudeへの指示を固定化
- 複数のセッションで同じタスクを継続する際の一貫性確保
- レビュー時の参照ドキュメントとして活用

## 使い方

### 1. 新規タスク作成

```bash
cp .claude/tasks/TEMPLATE.md .claude/tasks/feature-xxx.md
```

### 2. 仕様を記述

TEMPLATEに従って以下を記述:

- 概要・背景
- 機能要件・非機能要件
- 設計（影響範囲、ドメインモデル、API）
- 実装手順
- 完了条件

### 3. Claudeに実装を依頼

```
/implement .claude/tasks/feature-xxx.md
```

### 4. レビューを依頼

```
/review .claude/tasks/feature-xxx.md
```

## ファイル命名規則

| パターン          | 用途             |
| ----------------- | ---------------- |
| `feature-xxx.md`  | 新機能           |
| `fix-xxx.md`      | バグ修正         |
| `refactor-xxx.md` | リファクタリング |
| `docs-xxx.md`     | ドキュメント     |

## 完了したタスク

完了したタスクは `completed/` サブディレクトリに移動してください。

```bash
mv .claude/tasks/feature-xxx.md .claude/tasks/completed/
```

## 注意事項

- タスク仕様はできるだけ具体的に書く
- 曖昧な要件はClaude実行時に確認が入り、効率が下がる
- 完了条件を明確にすることで、実装完了の判断が容易になる
