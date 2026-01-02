/**
 * シードダンジョンのメタ情報
 *
 * E2Eテストやシードスクリプトで共有するためのフィクスチャ
 * 実際のシードデータ（apps/api/src/scripts/data/）と同期を保つこと
 */

/** シードダンジョンのメタ情報 */
export const SEED_DUNGEONS = {
  cathedral: {
    id: "20000000-0000-4000-8000-000000000001",
    name: "忘却の聖堂",
    alias: "神が目を逸らした場所",
    layerCount: 3,
  },
  ashCity: {
    id: "20000000-0000-4000-8000-000000000002",
    name: "灰燼の街の廃墟",
    alias: "燃え尽きた記憶の地",
    layerCount: 3,
  },
  shipwreck: {
    id: "20000000-0000-4000-8000-000000000003",
    name: "渡りの海の沈没船",
    alias: "帰らぬ航海の果て",
    layerCount: 2,
  },
} as const;

export type SeedDungeonKey = keyof typeof SEED_DUNGEONS;
