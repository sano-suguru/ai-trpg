/**
 * シードキャラクターのメタ情報
 *
 * E2Eテストやシードスクリプトで共有するためのフィクスチャ
 * 実際のシードデータ（apps/api/src/scripts/data/）と同期を保つこと
 */

/** シード用の固定オーナーID */
export const SEED_OWNER_ID = "00000000-0000-4000-8000-000000000001";

/** シードキャラクターのメタ情報 */
export const SEED_CHARACTERS = {
  sed: {
    id: "10000000-0000-4000-8000-000000000001",
    name: "灰村のセド",
    title: "贖いを探す者",
  },
  lila: {
    id: "10000000-0000-4000-8000-000000000002",
    name: "リラ",
    title: "喪われた声の魔女",
  },
  volk: {
    id: "10000000-0000-4000-8000-000000000003",
    name: "灰色のヴォルク",
    title: "最後の傭兵",
  },
  elena: {
    id: "10000000-0000-4000-8000-000000000004",
    name: "朽ちゆく月のエレナ",
    title: "没落貴族の剣",
  },
  nameless: {
    id: "10000000-0000-4000-8000-000000000005",
    name: "名なし",
    title: "呪いを背負う者",
  },
} as const;

export type SeedCharacterKey = keyof typeof SEED_CHARACTERS;
