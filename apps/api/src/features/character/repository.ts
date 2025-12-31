/**
 * Character Repository
 *
 * キャラクターの永続化を担当
 * Port（インターフェース）とAdapter（実装）を同一ファイルに定義
 */

import { ResultAsync, ok, err } from "neverthrow";
import { eq, and } from "drizzle-orm";
import { Character, CharacterId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { Database } from "../../infrastructure/database/client";
import { characters } from "../../infrastructure/database/schema";
import { toDomain, toNewRow, toUpdateRow } from "./mapper";

// ========================================
// Port (Interface)
// ========================================

export interface CharacterRepository {
  findById(id: CharacterId): ResultAsync<Character | null, AppError>;
  findByOwnerId(ownerId: UserId): ResultAsync<readonly Character[], AppError>;
  findBorrowable(): ResultAsync<readonly Character[], AppError>;
  save(character: Character): ResultAsync<Character, AppError>;
  update(character: Character): ResultAsync<Character, AppError>;
  delete(id: CharacterId): ResultAsync<void, AppError>;
}

// ========================================
// Adapter (Implementation)
// ========================================

/**
 * Drizzle ORMを使用したCharacterRepository実装
 */
export function createCharacterRepository(db: Database): CharacterRepository {
  return {
    findById(id: CharacterId): ResultAsync<Character | null, AppError> {
      return ResultAsync.fromPromise(
        db.query.characters.findFirst({
          where: eq(characters.id, id as string),
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((row) => {
        if (!row) return ok(null);
        return toDomain(row).mapErr((e) => Errors.database("read", e.message));
      });
    },

    findByOwnerId(
      ownerId: UserId,
    ): ResultAsync<readonly Character[], AppError> {
      return ResultAsync.fromPromise(
        db.query.characters.findMany({
          where: eq(characters.ownerId, ownerId as string),
          orderBy: (characters, { desc }) => [desc(characters.updatedAt)],
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Character[] = [];
        for (const row of rows) {
          const result = toDomain(row);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    findBorrowable(): ResultAsync<readonly Character[], AppError> {
      return ResultAsync.fromPromise(
        db.query.characters.findMany({
          where: and(
            eq(characters.isPublic, true),
            // lending !== 'private' は別途フィルタ
          ),
          orderBy: (characters, { desc }) => [desc(characters.updatedAt)],
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Character[] = [];
        for (const row of rows) {
          if (row.lending === "private") continue;
          const result = toDomain(row);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    save(character: Character): ResultAsync<Character, AppError> {
      const row = toNewRow(character);
      return ResultAsync.fromPromise(
        db.insert(characters).values(row).returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.database("write", "Failed to insert character"));
        }
        return toDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    update(character: Character): ResultAsync<Character, AppError> {
      const updateData = toUpdateRow(character);
      return ResultAsync.fromPromise(
        db
          .update(characters)
          .set(updateData)
          .where(eq(characters.id, character.id as string))
          .returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.notFound("Character", character.id as string));
        }
        return toDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    delete(id: CharacterId): ResultAsync<void, AppError> {
      return ResultAsync.fromPromise(
        db.delete(characters).where(eq(characters.id, id as string)),
        (e: unknown) => Errors.database("delete", String(e)),
      ).map(() => undefined);
    },
  };
}
