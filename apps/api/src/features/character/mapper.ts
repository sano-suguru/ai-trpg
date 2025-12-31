/**
 * Character Mapper
 *
 * DB行とドメインモデル間の変換
 */

import { Result, ok, err } from "neverthrow";
import {
  Character,
  CharacterFragments,
  CharacterDirectives,
  HistoryEntry,
  Relationship,
  VoiceSample,
  createCharacterFragments,
  createCharacterDirectives,
  createCharacterName,
  createCharacterTitle,
  createBiography,
  createLendingSetting,
  FragmentCategories,
  UnsafeIds,
} from "@ai-trpg/shared/domain";
import type { ValidationError } from "@ai-trpg/shared/types";
import type {
  CharacterRow,
  NewCharacterRow,
  CharacterFragmentsJson,
  CharacterDirectivesJson,
  VoiceSampleJson,
  HistoryEntryJson,
  RelationshipJson,
} from "../../infrastructure/database/schema";

// ========================================
// DB Row → Domain Model
// ========================================

/**
 * DB行からドメインモデルへ変換
 */
export function toDomain(
  row: CharacterRow,
): Result<Character, ValidationError> {
  const nameResult = createCharacterName(row.name);
  if (nameResult.isErr()) return err(nameResult.error);

  const titleResult = createCharacterTitle(row.title);
  if (titleResult.isErr()) return err(titleResult.error);

  const biographyResult = createBiography(row.biography);
  if (biographyResult.isErr()) return err(biographyResult.error);

  const lendingResult = createLendingSetting(row.lending);
  if (lendingResult.isErr()) return err(lendingResult.error);

  const fragmentsResult = jsonToFragments(row.fragments);
  if (fragmentsResult.isErr()) return err(fragmentsResult.error);

  const directivesResult = jsonToDirectives(row.directives);
  if (directivesResult.isErr()) return err(directivesResult.error);

  return ok({
    _tag: "Character",
    id: UnsafeIds.characterId(row.id),
    ownerId: UnsafeIds.userId(row.ownerId),
    name: nameResult.value,
    title: titleResult.value,
    fragments: fragmentsResult.value,
    directives: directivesResult.value,
    biography: biographyResult.value,
    voiceSamples: jsonToVoiceSamples(row.voiceSamples),
    history: jsonToHistory(row.history),
    relationships: jsonToRelationships(row.relationships),
    currentWounds: row.currentWounds,
    currentQuestions: row.currentQuestions,
    lending: lendingResult.value,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

// ========================================
// Domain Model → DB Row
// ========================================

/**
 * ドメインモデルからDB行への変換（新規作成用）
 */
export function toNewRow(character: Character): NewCharacterRow {
  return {
    id: character.id as string,
    ownerId: character.ownerId as string,
    name: character.name as string,
    title: character.title as string,
    biography: character.biography as string,
    fragments: fragmentsToJson(character.fragments),
    directives: directivesToJson(character.directives),
    voiceSamples: voiceSamplesToJson(character.voiceSamples),
    history: historyToJson(character.history),
    relationships: relationshipsToJson(character.relationships),
    currentWounds: [...character.currentWounds],
    currentQuestions: [...character.currentQuestions],
    lending: character.lending,
    isPublic: character.isPublic,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

/**
 * ドメインモデルからDB更新用の部分行への変換
 */
export function toUpdateRow(
  character: Character,
): Omit<NewCharacterRow, "id" | "ownerId" | "createdAt"> {
  return {
    name: character.name as string,
    title: character.title as string,
    biography: character.biography as string,
    fragments: fragmentsToJson(character.fragments),
    directives: directivesToJson(character.directives),
    voiceSamples: voiceSamplesToJson(character.voiceSamples),
    history: historyToJson(character.history),
    relationships: relationshipsToJson(character.relationships),
    currentWounds: [...character.currentWounds],
    currentQuestions: [...character.currentQuestions],
    lending: character.lending,
    isPublic: character.isPublic,
    updatedAt: character.updatedAt,
  };
}

// ========================================
// JSON ⇔ Domain Helpers
// ========================================

function jsonToFragments(
  json: CharacterFragmentsJson,
): Result<CharacterFragments, ValidationError> {
  return createCharacterFragments({
    origin: json.origin.text,
    loss: json.loss.text,
    mark: json.mark.text,
    sin: json.sin?.text ?? null,
    quest: json.quest?.text ?? null,
    trait: json.trait?.text ?? null,
  });
}

function fragmentsToJson(
  fragments: CharacterFragments,
): CharacterFragmentsJson {
  return {
    origin: {
      category: FragmentCategories.ORIGIN,
      text: fragments.origin.text as string,
    },
    loss: {
      category: FragmentCategories.LOSS,
      text: fragments.loss.text as string,
    },
    mark: {
      category: FragmentCategories.MARK,
      text: fragments.mark.text as string,
    },
    sin: fragments.sin
      ? { category: FragmentCategories.SIN, text: fragments.sin.text as string }
      : null,
    quest: fragments.quest
      ? {
          category: FragmentCategories.QUEST,
          text: fragments.quest.text as string,
        }
      : null,
    trait: fragments.trait
      ? {
          category: FragmentCategories.TRAIT,
          text: fragments.trait.text as string,
        }
      : null,
  };
}

function jsonToDirectives(
  json: CharacterDirectivesJson,
): Result<CharacterDirectives, ValidationError> {
  return createCharacterDirectives({
    danger: json.danger,
    allyInPeril: json.ally_in_peril,
    moralChoice: json.moral_choice,
    unknown: json.unknown,
  });
}

function directivesToJson(
  directives: CharacterDirectives,
): CharacterDirectivesJson {
  return {
    danger: directives.danger.response as string,
    ally_in_peril: directives.allyInPeril.response as string,
    moral_choice: directives.moralChoice.response as string,
    unknown: directives.unknown.response as string,
  };
}

function jsonToVoiceSamples(json: VoiceSampleJson[]): readonly VoiceSample[] {
  return json.map((v) => ({
    situation: v.situation,
    sample: v.sample,
  }));
}

function voiceSamplesToJson(
  samples: readonly VoiceSample[],
): VoiceSampleJson[] {
  return samples.map((s) => ({
    situation: s.situation,
    sample: s.sample,
  }));
}

function jsonToHistory(json: HistoryEntryJson[]): readonly HistoryEntry[] {
  return json.map((h) => ({
    sessionId: UnsafeIds.sessionId(h.sessionId),
    dungeonName: h.dungeonName,
    partyMembers: h.partyMembers,
    outcome: h.outcome,
    wounds: h.wounds,
    date: new Date(h.date),
  }));
}

function historyToJson(history: readonly HistoryEntry[]): HistoryEntryJson[] {
  return history.map((h) => ({
    sessionId: h.sessionId as string,
    dungeonName: h.dungeonName,
    partyMembers: [...h.partyMembers],
    outcome: h.outcome,
    wounds: [...h.wounds],
    date: h.date.toISOString(),
  }));
}

function jsonToRelationships(
  json: RelationshipJson[],
): readonly Relationship[] {
  return json.map((r) => ({
    characterId: UnsafeIds.characterId(r.characterId),
    characterName: r.characterName,
    nature: r.nature,
    detail: r.detail,
  }));
}

function relationshipsToJson(
  relationships: readonly Relationship[],
): RelationshipJson[] {
  return relationships.map((r) => ({
    characterId: r.characterId as string,
    characterName: r.characterName,
    nature: r.nature,
    detail: r.detail,
  }));
}
