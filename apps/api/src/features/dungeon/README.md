# Dungeon Feature

ダンジョンのCRUD操作を提供するFeature Slice。

## ディレクトリ構成

```
dungeon/
├── router.ts         # tRPCルーター定義
├── repository.ts     # データアクセス層（Port & Adapter）
├── mapper.ts         # DB ⇔ ドメインモデル変換
├── useCases/         # ユースケース
│   ├── createDungeon.ts
│   ├── getDungeon.ts
│   ├── listDungeons.ts
│   ├── updateDungeon.ts
│   └── deleteDungeon.ts
├── index.ts          # エクスポート
└── README.md         # このファイル
```

## API エンドポイント

| エンドポイント     | メソッド | 認証 | 説明                                |
| ------------------ | -------- | ---- | ----------------------------------- |
| `dungeon.list`     | Query    | 不要 | 公開ダンジョン一覧（playCount順）   |
| `dungeon.listMine` | Query    | 必須 | 自分のダンジョン一覧（updatedAt順） |
| `dungeon.get`      | Query    | 不要 | ダンジョン詳細取得                  |
| `dungeon.create`   | Mutation | 必須 | ダンジョン作成                      |
| `dungeon.update`   | Mutation | 必須 | ダンジョン更新（自分のみ）          |
| `dungeon.delete`   | Mutation | 必須 | ダンジョン削除（自分のみ）          |

## 使用例

### フロントエンドから呼び出し

```typescript
// 公開ダンジョン一覧
const dungeons = await trpc.dungeon.list.query();

// 自分のダンジョン一覧
const myDungeons = await trpc.dungeon.listMine.query();

// ダンジョン取得
const dungeon = await trpc.dungeon.get.query({ id: dungeonId });

// ダンジョン作成
const newDungeon = await trpc.dungeon.create.mutate({
  name: "忘却の聖堂",
  alias: "神が目を逸らした場所",
  // ...
});

// ダンジョン更新
const updated = await trpc.dungeon.update.mutate({
  id: dungeonId,
  name: "新しい名前",
});

// ダンジョン削除
await trpc.dungeon.delete.mutate({ id: dungeonId });
```

## Repository

### インターフェース

```typescript
interface DungeonRepository {
  findById(id: DungeonId): ResultAsync<Dungeon | null, AppError>;
  findByAuthorId(authorId: UserId): ResultAsync<readonly Dungeon[], AppError>;
  findPublic(): ResultAsync<readonly Dungeon[], AppError>;
  save(dungeon: Dungeon): ResultAsync<Dungeon, AppError>;
  update(dungeon: Dungeon): ResultAsync<Dungeon, AppError>;
  delete(id: DungeonId): ResultAsync<void, AppError>;
  incrementPlayCount(id: DungeonId): ResultAsync<void, AppError>;
}
```

### 実装

`createDungeonRepository(db)` でDrizzle ORMを使用した実装を生成。

## UseCases

| UseCase                     | 説明                                                     |
| --------------------------- | -------------------------------------------------------- |
| `createDungeonUseCase`      | 新規ダンジョン作成。ID生成→バリデーション→永続化         |
| `getDungeonUseCase`         | ダンジョン取得。公開または自分のダンジョンのみアクセス可 |
| `listPublicDungeonsUseCase` | 公開ダンジョン一覧取得                                   |
| `listMyDungeonsUseCase`     | 自分のダンジョン一覧取得                                 |
| `updateDungeonUseCase`      | ダンジョン更新。所有権チェック有り                       |
| `deleteDungeonUseCase`      | ダンジョン削除。所有権チェック有り                       |

## Mapper

DB行とドメインモデル間の変換を担当。

| 関数                   | 説明                       |
| ---------------------- | -------------------------- |
| `toDomain(row)`        | DB行 → Dungeonエンティティ |
| `toNewRow(dungeon)`    | Dungeon → 新規INSERT用行   |
| `toUpdateRow(dungeon)` | Dungeon → UPDATE用行       |

### JSONB変換

| DBカラム    | 型変換                                          |
| ----------- | ----------------------------------------------- |
| `lore`      | `DungeonLoreJson` ⇔ `DungeonLore`               |
| `layers`    | `DungeonLayerJson[]` ⇔ `DungeonLayer[]`         |
| `core`      | `DungeonCoreJson` ⇔ `DungeonCore`               |
| `resonance` | `ResonanceTriggerJson[]` ⇔ `ResonanceTrigger[]` |

## アクセス制御

| 操作         | 条件                               |
| ------------ | ---------------------------------- |
| 一覧（公開） | 誰でも可                           |
| 一覧（自分） | 認証済みユーザー                   |
| 詳細取得     | 公開ダンジョン or 自分のダンジョン |
| 作成         | 認証済みユーザー                   |
| 更新         | 所有者のみ                         |
| 削除         | 所有者のみ                         |

## 依存関係

```
router.ts
  ↓ uses
useCases/*
  ↓ uses
repository.ts (interface)
  ↓ implements
createDungeonRepository (adapter)
  ↓ uses
mapper.ts
  ↓ uses
@ai-trpg/shared/domain (Dungeon entity)
```

## 今後の拡張予定

- [ ] `incrementPlayCount` の呼び出し（セッション開始時）
- [ ] ページネーション対応
- [ ] タグ/試練タイプによるフィルタリング
- [ ] 検索機能
