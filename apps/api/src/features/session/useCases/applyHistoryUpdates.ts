/**
 * 履歴更新ユースケース
 *
 * セッション完了後にキャラクターの履歴・状態を更新
 */

import type {
  Character,
  HistoryEntry,
  Relationship,
} from "@ai-trpg/shared/domain";
import type { Replay, CharacterChange } from "@ai-trpg/shared/domain";
import type { AppError } from "@ai-trpg/shared/types";
import { ResultAsync } from "neverthrow";
import type { CharacterRepository } from "../../character/repository";

// ========================================
// Types
// ========================================

interface ApplyHistoryUpdatesDeps {
  readonly characterRepository: CharacterRepository;
}

interface ApplyHistoryUpdatesInput {
  readonly replay: Replay;
  readonly characters: readonly Character[];
}

interface ApplyHistoryUpdatesOutput {
  readonly updatedCharacters: readonly Character[];
}

// ========================================
// Use Case
// ========================================

/**
 * セッション完了後のキャラクター履歴更新を適用
 */
export function applyHistoryUpdates(
  deps: ApplyHistoryUpdatesDeps,
): (
  input: ApplyHistoryUpdatesInput,
) => ResultAsync<ApplyHistoryUpdatesOutput, AppError> {
  return (input) => {
    const { replay, characters } = input;
    const { characterRepository } = deps;

    // 各キャラクターに対して更新を適用
    const updateTasks = characters.map((character) => {
      // このキャラクターに関する変化を抽出
      const changes = replay.footer.characterChanges.filter(
        (c) => c.characterId === character.id,
      );

      // パーティメンバー名のリストを作成
      const partyMemberNames = replay.header.party
        .filter((m) => m.id !== character.id)
        .map((m) => m.name);

      // 履歴エントリを作成
      const historyEntry: HistoryEntry = {
        sessionId: replay.sessionId,
        dungeonName: replay.header.dungeonName,
        partyMembers: partyMemberNames,
        outcome: outcomeTypeToLabel(replay.header.outcomeType),
        wounds: changes
          .filter((c) => c.changeType === "wound")
          .map((c) => c.description),
        date: replay.createdAt,
      };

      // 傷の更新
      const newWounds = extractNewWounds(changes);
      const updatedWounds = [...character.currentWounds, ...newWounds];

      // 関係性の更新
      const newRelationships = extractNewRelationships(changes, characters);
      const updatedRelationships = mergeRelationships(
        character.relationships,
        newRelationships,
      );

      // 更新されたキャラクターを作成
      const updatedCharacter: Character = {
        ...character,
        history: [...character.history, historyEntry],
        currentWounds: updatedWounds,
        relationships: updatedRelationships,
        updatedAt: new Date(),
      };

      return characterRepository.update(updatedCharacter);
    });

    // すべての更新を並行実行
    return ResultAsync.combine(updateTasks).map((updatedCharacters) => ({
      updatedCharacters,
    }));
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * 結末タイプを日本語ラベルに変換
 */
function outcomeTypeToLabel(outcomeType: string): string {
  switch (outcomeType) {
    case "liberation":
      return "解放";
    case "loss":
      return "喪失";
    case "discovery":
      return "発見";
    case "choice":
      return "選択";
    case "confrontation":
      return "対決";
    default:
      return outcomeType;
  }
}

/**
 * 変化から新しい傷を抽出
 */
function extractNewWounds(
  changes: readonly CharacterChange[],
): readonly string[] {
  return changes
    .filter((c) => c.changeType === "wound")
    .map((c) => c.description);
}

/**
 * 変化から新しい関係性を抽出
 */
function extractNewRelationships(
  changes: readonly CharacterChange[],
  allCharacters: readonly Character[],
): readonly Relationship[] {
  return changes
    .filter((c) => c.changeType === "relationship")
    .map((c) => {
      // 関係性の詳細から対象キャラクターを推測
      // 簡易実装：descriptionをそのまま使用
      // 将来的にはAIが構造化データを返すようにする
      const targetChar = allCharacters.find(
        (char) =>
          c.description.includes(char.name as string) &&
          char.id !== c.characterId,
      );

      return {
        characterId: targetChar?.id ?? c.characterId,
        characterName: targetChar?.name ?? "不明",
        nature: "understanding" as const, // デフォルト
        detail: c.description,
      };
    });
}

/**
 * 既存の関係性と新しい関係性をマージ
 * 同じキャラクターへの関係性は上書き
 */
function mergeRelationships(
  existing: readonly Relationship[],
  newRels: readonly Relationship[],
): readonly Relationship[] {
  const merged = new Map<string, Relationship>();

  // 既存の関係性を追加
  for (const rel of existing) {
    merged.set(rel.characterId as string, rel);
  }

  // 新しい関係性で上書き
  for (const rel of newRels) {
    merged.set(rel.characterId as string, rel);
  }

  return Array.from(merged.values());
}
