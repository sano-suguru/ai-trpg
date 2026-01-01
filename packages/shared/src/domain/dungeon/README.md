# Dungeon Domain

ダンジョンのドメインモデル。ダンジョンは「キャラの傷を抉り、問いに答えを迫る場所」として設計。

## 概要

ダンジョンは物語の触媒として機能する。単なる「モンスターがいる洞窟」ではなく、キャラクターの断片と共鳴し、内面的な試練を与える場所。

## ファイル構成

| ファイル | 説明 |
|----------|------|
| `types.ts` | 型定義、Value Objects、Entity |
| `operations.ts` | ファクトリ関数、ドメイン操作 |
| `index.ts` | エクスポート |

## 主要な型

### Entity

| 型 | 説明 |
|----|------|
| `Dungeon` | ダンジョンエンティティ |
| `DungeonSummary` | 一覧表示用のサマリ |

### Value Objects

| 型 | 説明 |
|----|------|
| `DungeonName` | ダンジョン名（1-100文字） |
| `DungeonAlias` | 異名（最大200文字） |
| `DungeonLore` | ロア（過去・堕落・現在の3時間軸） |
| `DungeonLayer` | 層（名前、雰囲気、イベント） |
| `DungeonCore` | 核心（クライマックス） |
| `ResonanceTrigger` | 共鳴トリガー（キャラ断片との共鳴） |

### Enums

| 型 | 値 |
|----|-----|
| `DifficultyTone` | `light`, `normal`, `heavy`, `desperate` |
| `TrialType` | `combat`, `exploration`, `puzzle`, `moral_choice`, `inner_confrontation`, `survival`, `negotiation` |
| `CoreNature` | `choice`, `confrontation`, `discovery`, `loss`, `liberation` |

## ファクトリ関数

```typescript
import { createDungeon, CreateDungeonInput } from '@ai-trpg/shared/domain';

const input: CreateDungeonInput = {
  name: '忘却の聖堂',
  alias: '神が目を逸らした場所',
  layerCount: 3,
  recommendedParty: '2〜4人',
  difficultyTone: 'normal',
  tags: ['#朽ちた神聖', '#悔恨'],
  trialTypes: ['exploration', 'moral_choice'],
  lore: {
    past: 'かつては巡礼者が集う聖地だった',
    fall: '神官長の背信により呪われた',
    now: '朽ちた祈りの残響が響く廃墟',
  },
  layers: [
    {
      name: '外縁 - 沈黙の参道',
      atmosphere: '苔むした石畳、崩れた彫像',
      possibleEvents: ['古い祈りの声が聞こえる'],
    },
  ],
  core: {
    nature: 'choice',
    description: '祭壇の前で、過去の罪と向き合う',
    possibleOutcomes: ['赦しを得る', '拒絶する', '自らの罪を認める'],
  },
  resonance: [],
  isPublic: false,
};

const result = createDungeon(dungeonId, authorId, input);
// Result<Dungeon, ValidationError>
```

## 共鳴システム

キャラクターの断片とダンジョンが共鳴すると、特別なイベントが発生する。

```typescript
interface ResonanceTrigger {
  fragmentType: FragmentCategory; // origin | loss | mark | sin | quest | trait
  keywords: string[];             // マッチするキーワード
  effect: string;                 // 発動時の効果描写
}
```

例: キャラの「喪失」に「信仰」というキーワードがある場合、
「忘却の聖堂」の共鳴トリガーが発動し、特別なシーンが生成される。

## バリデーション規則

| フィールド | 制約 |
|------------|------|
| `name` | 1-100文字 |
| `alias` | 最大200文字 |
| `lore.past/fall/now` | 各最大1000文字 |
| `layer.name` | 最大100文字 |
| `layer.atmosphere` | 最大500文字 |
| `layer.possibleEvents` | 最大10個、各最大200文字 |
| `core.description` | 最大1000文字 |
| `core.possibleOutcomes` | 1-10個、各最大300文字 |
| `resonance.keywords` | 1-10個、各最大50文字 |
| `resonance.effect` | 1-500文字 |

## 依存関係

- `../primitives/ids.ts` - `DungeonId`, `UserId`
- `../character/fragments.ts` - `FragmentCategory`
- `../../lib/brand.ts` - Branded Type ユーティリティ
- `../../types/errors.ts` - エラー型
