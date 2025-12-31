# @ai-trpg/shared

フロントエンド・バックエンド共通で使用する型、スキーマ、ユーティリティを提供するパッケージ。

## ディレクトリ構成

```
src/
├── domain/           # ドメインモデル（FDM）
│   ├── primitives/   # Branded ID型
│   └── character/    # キャラクタードメイン
├── schemas/          # Zodスキーマ（API入力バリデーション）
├── types/            # エラー型、共通型
├── lib/              # ユーティリティ（Result型、Brand型）
└── constants/        # マスターデータ（断片、行動指針の選択肢）
```

## 設計原則

### Functional Domain Modeling (FDM)

**Branded Types（公称型）:**
```typescript
import { UserId, CharacterId } from '@ai-trpg/shared/domain/primitives';

// コンパイル時に型エラー
const userId: UserId = characterId; // Error!
```

**Smart Constructors:**
```typescript
import { createCharacter } from '@ai-trpg/shared/domain/character';

const result = createCharacter(input);
// Result<Character, ValidationError>

result.match({
  ok: (character) => console.log(character.name),
  err: (error) => console.error(error.message),
});
```

**Immutable by default:**
```typescript
interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly fragments: ReadonlyFragments;
}
```

### Result型エラーハンドリング

```typescript
import { ok, err, Result } from '@ai-trpg/shared/lib/result';
import { Errors } from '@ai-trpg/shared/types/errors';

function findUser(id: UserId): Result<User, AppError> {
  const user = db.find(id);
  if (!user) {
    return err(Errors.notFound('User', id));
  }
  return ok(user);
}
```

## エクスポート

### Domain Primitives

| 型 | 説明 |
|----|------|
| `UserId` | ユーザーID |
| `CharacterId` | キャラクターID |
| `DungeonId` | ダンジョンID |
| `SessionId` | セッションID |

### Domain Entities

| 型 | 説明 |
|----|------|
| `Character` | キャラクターエンティティ |
| `Fragments` | 断片（出自、喪失、刻印など） |
| `Directives` | 行動指針 |

### Schemas

| スキーマ | 説明 |
|----------|------|
| `createCharacterSchema` | キャラクター作成入力 |
| `updateCharacterSchema` | キャラクター更新入力 |

### Errors

| エラー型 | 説明 |
|----------|------|
| `NotFoundError` | リソースが見つからない |
| `ValidationError` | バリデーションエラー |
| `UnauthorizedError` | 認証エラー |
| `ForbiddenError` | 権限エラー |

## 依存関係

- 外部パッケージ以外に依存しない
- `apps/api` と `apps/web` から参照される
- 他のパッケージには依存しない

## 開発時の注意

1. **循環依存禁止** - ドメイン間の依存は primitives → entity の方向のみ
2. **any型禁止** - `unknown` + 型ガードを使用
3. **throw禁止** - `err()` でResult型を返す
4. **try-catch禁止** - 外部ライブラリのラップ時のみ `tryCatch()` を使用
