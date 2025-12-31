/**
 * キャラクター集約型定義
 *
 * キャラクターのライフサイクル状態を判別共用体で表現し、
 * 不正な状態遷移を型レベルで防止する
 */

import { Result, ok, err } from "neverthrow";
import { Brand, asBrand } from "../../lib/brand";
import { Errors, ValidationError } from "../../types/errors";
import { CharacterId, UserId, SessionId } from "../primitives/ids";
import { CharacterFragments } from "./fragments";
import { CharacterDirectives } from "./directives";

// ========================================
// Character Value Objects
// ========================================

/** キャラクター名 */
export type CharacterName = Brand<string, "CharacterName">;

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 50;

export function createCharacterName(
  value: string
): Result<CharacterName, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length < NAME_MIN_LENGTH) {
    return err(Errors.validation("キャラクター名は必須です", "name"));
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return err(
      Errors.validation(
        `キャラクター名は${NAME_MAX_LENGTH}文字以内にしてください`,
        "name"
      )
    );
  }

  return ok(asBrand<"CharacterName">(trimmed));
}

/** キャラクター称号（AI生成、編集可） */
export type CharacterTitle = Brand<string, "CharacterTitle">;

const TITLE_MAX_LENGTH = 100;

export function createCharacterTitle(
  value: string
): Result<CharacterTitle, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.length > TITLE_MAX_LENGTH) {
    return err(
      Errors.validation(
        `称号は${TITLE_MAX_LENGTH}文字以内にしてください`,
        "title"
      )
    );
  }

  return ok(asBrand<"CharacterTitle">(trimmed));
}

/** 経歴（AI生成、プレイヤー承認済） */
export type Biography = Brand<string, "Biography">;

const BIOGRAPHY_MAX_LENGTH = 2000;

export function createBiography(
  value: string
): Result<Biography, ValidationError> {
  if (value.length > BIOGRAPHY_MAX_LENGTH) {
    return err(
      Errors.validation(
        `経歴は${BIOGRAPHY_MAX_LENGTH}文字以内にしてください`,
        "biography"
      )
    );
  }

  return ok(asBrand<"Biography">(value));
}

// ========================================
// Lending Settings
// ========================================

/**
 * 借用設定
 */
export const LendingSettings = {
  /** 全開放 - 死亡含め全反映OK */
  ALL: "all",
  /** 安全 - ハイブリッドルール適用（デフォルト） */
  SAFE: "safe",
  /** 非公開 - 借用不可 */
  PRIVATE: "private",
} as const;

export type LendingSetting =
  (typeof LendingSettings)[keyof typeof LendingSettings];

export function isLendingSetting(value: unknown): value is LendingSetting {
  return value === "all" || value === "safe" || value === "private";
}

export function createLendingSetting(
  value: string
): Result<LendingSetting, ValidationError> {
  if (!isLendingSetting(value)) {
    return err(
      Errors.validation(
        "無効な公開設定です。all, safe, private のいずれかを指定してください",
        "lending"
      )
    );
  }
  return ok(value);
}

// ========================================
// Voice Sample
// ========================================

/**
 * 口調サンプル（AIがキャラの喋り方を真似るための参考）
 */
export interface VoiceSample {
  readonly situation: string;
  readonly sample: string;
}

// ========================================
// Session History
// ========================================

/**
 * セッション履歴エントリ
 */
export interface HistoryEntry {
  readonly sessionId: SessionId;
  readonly dungeonName: string;
  readonly partyMembers: readonly string[];
  readonly outcome: string;
  readonly wounds: readonly string[];
  readonly date: Date;
}

// ========================================
// Character Relationship
// ========================================

/**
 * 他キャラとの関係性
 */
export interface Relationship {
  readonly characterId: CharacterId;
  readonly characterName: string;
  readonly nature: "debt" | "trust" | "rival" | "understanding" | "enmity";
  readonly detail: string;
}

// ========================================
// Character States (Discriminated Union)
// ========================================

/**
 * 下書きキャラクター - 作成中、未完成
 */
export interface DraftCharacter {
  readonly _tag: "DraftCharacter";
  readonly ownerId: UserId;
  readonly name: CharacterName | null;
  readonly fragments: Partial<CharacterFragments>;
  readonly directives: Partial<CharacterDirectives>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 完成キャラクター - 全必須フィールドが揃い、使用可能
 */
export interface Character {
  readonly _tag: "Character";
  readonly id: CharacterId;
  readonly ownerId: UserId;
  readonly name: CharacterName;
  readonly title: CharacterTitle;
  readonly fragments: CharacterFragments;
  readonly directives: CharacterDirectives;
  readonly biography: Biography;
  readonly voiceSamples: readonly VoiceSample[];
  readonly history: readonly HistoryEntry[];
  readonly relationships: readonly Relationship[];
  readonly currentWounds: readonly string[];
  readonly currentQuestions: readonly string[];
  readonly lending: LendingSetting;
  readonly isPublic: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 借用可能キャラクター - 他プレイヤーがパーティ編成で選択可能なビュー
 *
 * 履歴や関係性など、プライベートな情報は除外される
 */
export interface BorrowableCharacter {
  readonly _tag: "BorrowableCharacter";
  readonly id: CharacterId;
  readonly ownerId: UserId;
  readonly name: CharacterName;
  readonly title: CharacterTitle;
  readonly fragments: CharacterFragments;
  readonly directives: CharacterDirectives;
  readonly biography: Biography;
  readonly voiceSamples: readonly VoiceSample[];
  readonly lending: Exclude<LendingSetting, "private">;
}

// ========================================
// Type Guards
// ========================================

export function isDraftCharacter(
  c: DraftCharacter | Character
): c is DraftCharacter {
  return c._tag === "DraftCharacter";
}

export function isCharacter(c: DraftCharacter | Character): c is Character {
  return c._tag === "Character";
}

export function isBorrowable(
  c: Character
): c is Character & { lending: Exclude<LendingSetting, "private"> } {
  return c.lending !== "private" && c.isPublic;
}

// ========================================
// Character Summary (for lists)
// ========================================

/**
 * キャラクター一覧用のサマリ型
 */
export interface CharacterSummary {
  readonly id: CharacterId;
  readonly name: CharacterName;
  readonly title: CharacterTitle;
  readonly originFragment: string;
  readonly isPublic: boolean;
  readonly lending: LendingSetting;
}

/**
 * Characterからサマリを生成
 */
export function toCharacterSummary(character: Character): CharacterSummary {
  return {
    id: character.id,
    name: character.name,
    title: character.title,
    originFragment: character.fragments.origin.text as string,
    isPublic: character.isPublic,
    lending: character.lending,
  };
}
