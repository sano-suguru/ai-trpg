/**
 * キャラクタードメイン操作（純粋関数）
 *
 * キャラクターの状態変更を行う純粋関数群
 * 全ての操作は新しいオブジェクトを返し、元のオブジェクトは変更しない
 */

import { Result, ok, err } from "neverthrow";
import { Errors, ValidationError, CharacterError } from "../../types/errors";
import { CharacterId, UserId, UnsafeIds } from "../primitives/ids";
import {
  Character,
  BorrowableCharacter,
  HistoryEntry,
  Relationship,
  VoiceSample,
  LendingSetting,
  createCharacterName,
  createCharacterTitle,
  createBiography,
  createLendingSetting,
} from "./types";
import { CreateFragmentsInput, createCharacterFragments } from "./fragments";
import { CreateDirectivesInput, createCharacterDirectives } from "./directives";

// ========================================
// Character Update
// ========================================

/**
 * キャラクター更新用の入力型
 */
export interface UpdateCharacterInput {
  readonly name?: string;
  readonly title?: string;
  readonly biography?: string;
  readonly lending?: string;
  readonly isPublic?: boolean;
  readonly voiceSamples?: readonly VoiceSample[];
}

/**
 * キャラクターを更新
 *
 * @returns 新しいCharacterインスタンス
 */
export function updateCharacter(
  character: Character,
  input: UpdateCharacterInput,
): Result<Character, ValidationError> {
  let newName = character.name;
  let newTitle = character.title;
  let newBiography = character.biography;
  let newLending = character.lending;
  let newIsPublic = character.isPublic;
  let newVoiceSamples = character.voiceSamples;

  if (input.name !== undefined) {
    const result = createCharacterName(input.name);
    if (result.isErr()) return err(result.error);
    newName = result.value;
  }

  if (input.title !== undefined) {
    const result = createCharacterTitle(input.title);
    if (result.isErr()) return err(result.error);
    newTitle = result.value;
  }

  if (input.biography !== undefined) {
    const result = createBiography(input.biography);
    if (result.isErr()) return err(result.error);
    newBiography = result.value;
  }

  if (input.lending !== undefined) {
    const result = createLendingSetting(input.lending);
    if (result.isErr()) return err(result.error);
    newLending = result.value;
  }

  if (input.isPublic !== undefined) {
    newIsPublic = input.isPublic;
  }

  if (input.voiceSamples !== undefined) {
    newVoiceSamples = input.voiceSamples;
  }

  return ok({
    ...character,
    name: newName,
    title: newTitle,
    biography: newBiography,
    lending: newLending,
    isPublic: newIsPublic,
    voiceSamples: newVoiceSamples,
    updatedAt: new Date(),
  });
}

// ========================================
// History Operations
// ========================================

/**
 * セッション履歴を追加
 */
export function addHistoryEntry(
  character: Character,
  entry: Omit<HistoryEntry, "sessionId"> & { sessionId: string },
): Character {
  const historyEntry: HistoryEntry = {
    ...entry,
    sessionId: UnsafeIds.sessionId(entry.sessionId),
  };

  return {
    ...character,
    history: [...character.history, historyEntry],
    updatedAt: new Date(),
  };
}

/**
 * 現在の傷を更新
 */
export function updateCurrentWounds(
  character: Character,
  wounds: readonly string[],
): Character {
  return {
    ...character,
    currentWounds: wounds,
    updatedAt: new Date(),
  };
}

/**
 * 傷を追加
 */
export function addWound(character: Character, wound: string): Character {
  return {
    ...character,
    currentWounds: [...character.currentWounds, wound],
    updatedAt: new Date(),
  };
}

/**
 * 傷を癒す（削除）
 */
export function healWound(character: Character, woundIndex: number): Character {
  return {
    ...character,
    currentWounds: character.currentWounds.filter((_, i) => i !== woundIndex),
    updatedAt: new Date(),
  };
}

// ========================================
// Relationship Operations
// ========================================

/**
 * 関係性を追加または更新
 */
export function upsertRelationship(
  character: Character,
  relationship: Omit<Relationship, "characterId"> & { characterId: string },
): Character {
  const newRelationship: Relationship = {
    ...relationship,
    characterId: UnsafeIds.characterId(relationship.characterId),
  };

  const existingIndex = character.relationships.findIndex(
    (r: Relationship) => r.characterId === newRelationship.characterId,
  );

  const newRelationships =
    existingIndex >= 0
      ? [
          ...character.relationships.slice(0, existingIndex),
          newRelationship,
          ...character.relationships.slice(existingIndex + 1),
        ]
      : [...character.relationships, newRelationship];

  return {
    ...character,
    relationships: newRelationships,
    updatedAt: new Date(),
  };
}

/**
 * 関係性を削除
 */
export function removeRelationship(
  character: Character,
  targetCharacterId: CharacterId,
): Character {
  return {
    ...character,
    relationships: character.relationships.filter(
      (r) => r.characterId !== targetCharacterId,
    ),
    updatedAt: new Date(),
  };
}

// ========================================
// Borrowing Operations
// ========================================

/**
 * CharacterをBorrowableCharacterビューに変換
 *
 * プライベート設定または非公開の場合はエラー
 */
export function toBorrowableView(
  character: Character,
): Result<BorrowableCharacter, CharacterError> {
  if (character.lending === "private") {
    return err(Errors.characterNotBorrowable(character.id as string));
  }

  if (!character.isPublic) {
    return err(Errors.characterNotBorrowable(character.id as string));
  }

  return ok({
    _tag: "BorrowableCharacter",
    id: character.id,
    ownerId: character.ownerId,
    name: character.name,
    title: character.title,
    fragments: character.fragments,
    directives: character.directives,
    biography: character.biography,
    voiceSamples: character.voiceSamples,
    lending: character.lending as Exclude<LendingSetting, "private">,
  });
}

// ========================================
// Session Participation Rules
// ========================================

/**
 * セッションに参加可能かどうか
 */
export function canParticipateInSession(character: Character): boolean {
  return character._tag === "Character";
}

/**
 * セッションで死亡可能かどうか
 *
 * @param isOwner - リクエストユーザーがキャラクターの所有者かどうか
 */
export function canDieInSession(
  character: BorrowableCharacter | Character,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;

  // 借用キャラの場合、lending === "all" のみ死亡可能
  return character.lending === "all";
}

/**
 * セッションで永続的な変化を受けられるかどうか
 */
export function canHavePermanentChanges(
  character: BorrowableCharacter | Character,
  isOwner: boolean,
): boolean {
  if (isOwner) return true;

  // 借用キャラの場合、lending === "all" のみ永続的変更可能
  return character.lending === "all";
}

// ========================================
// Character Creation
// ========================================

/**
 * 新規キャラクター作成用の入力型
 */
export interface CreateCharacterInput {
  readonly name: string;
  readonly title: string;
  readonly fragments: CreateFragmentsInput;
  readonly directives: CreateDirectivesInput;
  readonly biography: string;
  readonly voiceSamples?: readonly VoiceSample[];
  readonly lending?: string;
  readonly isPublic?: boolean;
}

/**
 * キャラクター作成（バリデーション付き）
 *
 * @param id - 新規生成されたCharacterId
 * @param ownerId - キャラクター所有者のUserId
 * @param input - 作成入力
 */
export function createCharacter(
  id: CharacterId,
  ownerId: UserId,
  input: CreateCharacterInput,
): Result<Character, ValidationError> {
  const nameResult = createCharacterName(input.name);
  if (nameResult.isErr()) return err(nameResult.error);

  const titleResult = createCharacterTitle(input.title);
  if (titleResult.isErr()) return err(titleResult.error);

  const fragmentsResult = createCharacterFragments(input.fragments);
  if (fragmentsResult.isErr()) return err(fragmentsResult.error);

  const directivesResult = createCharacterDirectives(input.directives);
  if (directivesResult.isErr()) return err(directivesResult.error);

  const biographyResult = createBiography(input.biography);
  if (biographyResult.isErr()) return err(biographyResult.error);

  const lendingResult = createLendingSetting(input.lending ?? "safe");
  if (lendingResult.isErr()) return err(lendingResult.error);

  const now = new Date();

  return ok({
    _tag: "Character",
    id,
    ownerId,
    name: nameResult.value,
    title: titleResult.value,
    fragments: fragmentsResult.value,
    directives: directivesResult.value,
    biography: biographyResult.value,
    voiceSamples: input.voiceSamples ?? [],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: lendingResult.value,
    isPublic: input.isPublic ?? false,
    createdAt: now,
    updatedAt: now,
  });
}
