/**
 * 共鳴スキャンサービス
 *
 * パーティの断片とダンジョンの共鳴トリガーを照合し、
 * 発火するイベントを検出する
 */

import {
  CharacterId,
  CharacterFragments,
  FragmentCategory,
  TriggeredEvent,
  EventPriorities,
} from "@ai-trpg/shared/domain";
import type { ResonanceTrigger } from "@ai-trpg/shared/domain";

/**
 * キャラクター情報（共鳴スキャン用）
 */
export interface CharacterForResonance {
  readonly id: CharacterId;
  readonly name: string;
  readonly fragments: CharacterFragments;
}

/**
 * 共鳴スキャン結果
 */
export interface ResonanceScanResult {
  /** 発火したイベント */
  readonly triggeredEvents: readonly TriggeredEvent[];
  /** スキャンしたキャラクター数 */
  readonly scannedCharacterCount: number;
  /** スキャンしたトリガー数 */
  readonly scannedTriggerCount: number;
}

/**
 * 断片カテゴリからテキストを取得
 */
function getFragmentText(
  fragments: CharacterFragments,
  category: FragmentCategory,
): string | null {
  const fragment = fragments[category];
  if (!fragment) return null;
  return fragment.text;
}

/**
 * キーワードがテキストに含まれているかチェック
 */
function matchesKeywords(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * 共鳴スキャンを実行
 *
 * @param party パーティのキャラクター情報
 * @param resonanceTriggers ダンジョンの共鳴トリガー
 * @returns 発火したイベントのリスト
 */
export function scanResonance(
  party: readonly CharacterForResonance[],
  resonanceTriggers: readonly ResonanceTrigger[],
): ResonanceScanResult {
  const triggeredEvents: TriggeredEvent[] = [];

  for (const character of party) {
    for (const trigger of resonanceTriggers) {
      const fragmentText = getFragmentText(
        character.fragments,
        trigger.fragmentType,
      );

      if (fragmentText && matchesKeywords(fragmentText, trigger.keywords)) {
        triggeredEvents.push({
          characterName: character.name,
          characterId: character.id,
          fragmentCategory: trigger.fragmentType,
          effect: trigger.effect,
          priority: EventPriorities.HIGH,
        });
      }
    }
  }

  return {
    triggeredEvents,
    scannedCharacterCount: party.length,
    scannedTriggerCount: resonanceTriggers.length,
  };
}

/**
 * 高優先度イベントのみを抽出
 */
export function filterHighPriorityEvents(
  events: readonly TriggeredEvent[],
): readonly TriggeredEvent[] {
  return events.filter((e) => e.priority === EventPriorities.HIGH);
}

/**
 * キャラクターごとにイベントをグループ化
 */
export function groupEventsByCharacter(
  events: readonly TriggeredEvent[],
): ReadonlyMap<CharacterId, readonly TriggeredEvent[]> {
  const grouped = new Map<CharacterId, TriggeredEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.characterId) ?? [];
    grouped.set(event.characterId, [...existing, event]);
  }

  return grouped;
}
